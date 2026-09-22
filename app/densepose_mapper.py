from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np
import torch

from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor

from densepose import add_densepose_config
from densepose.vis.extractor import DensePoseResultExtractor
from densepose.vis.densepose_results import DensePoseResultsFineSegmentationVisualizer

from .analyze import BODY_PARTS, summarize_person
MODEL_CONFIG = (
    "/opt/detectron2/projects/DensePose/configs/"
    "densepose_rcnn_R_50_FPN_s1x.yaml"
)
MODEL_WEIGHTS = "/workspace/models/model_final_162be9.pkl"

class DensePoseMapper:
    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold

        cfg = get_cfg()
        add_densepose_config(cfg)
        cfg.merge_from_file(MODEL_CONFIG)

        cfg.MODEL.WEIGHTS = MODEL_WEIGHTS
        cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = threshold
        cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

        # Smaller test images make CPU inference substantially faster while
        # preserving the original image dimensions for generated outputs.
        test_size = int(os.getenv("DENSEPOSE_TEST_SIZE", "800"))
        cfg.INPUT.MIN_SIZE_TEST = min(test_size, 800)
        cfg.INPUT.MAX_SIZE_TEST = test_size

        self.device = cfg.MODEL.DEVICE
        self.predictor = DefaultPredictor(cfg)

        self.extractor = DensePoseResultExtractor()
        self.visualizer = DensePoseResultsFineSegmentationVisualizer(
            alpha=0.7
        )

    def predict(self, image_bgr: np.ndarray):
        outputs = self.predictor(image_bgr)
        instances = outputs["instances"].to("cpu")

        results, boxes_xywh = self.extractor(instances)

        scores = (
            instances.scores.numpy()
            if instances.has("scores")
            else np.array([])
        )

        boxes_xyxy = (
            instances.pred_boxes.tensor.numpy()
            if instances.has("pred_boxes")
            else np.empty((0, 4))
        )

        return instances, results, boxes_xywh, scores, boxes_xyxy

    @staticmethod
    def make_iuv_image(results, boxes_xywh, image_shape):
        height, width = image_shape[:2]

        iuv_canvas = np.zeros((height, width, 3), dtype=np.uint8)

        if results is None or boxes_xywh is None:
            return iuv_canvas

        boxes = boxes_xywh.cpu().numpy()

        for result, box in zip(results, boxes):
            iuv = torch.cat(
                (
                    result.labels[None].float(),
                    result.uv * 255.0,
                )
            ).byte().cpu().numpy()

            x, y, w, h = [int(round(v)) for v in box]

            x0 = max(0, x)
            y0 = max(0, y)
            x1 = min(width, x + w)
            y1 = min(height, y + h)

            if x1 <= x0 or y1 <= y0:
                continue

            crop_w = x1 - x0
            crop_h = y1 - y0

            resized = cv2.resize(
                np.transpose(iuv, (1, 2, 0)),
                (crop_w, crop_h),
                interpolation=cv2.INTER_NEAREST,
            )

            mask = resized[:, :, 0] > 0
            region = iuv_canvas[y0:y1, x0:x1]
            region[mask] = resized[mask]
            iuv_canvas[y0:y1, x0:x1] = region

        return iuv_canvas

    @staticmethod
    def make_body_part_map(iuv_image: np.ndarray) -> np.ndarray:
        labels = iuv_image[:, :, 0]
        scaled = (labels.astype(np.float32) * (255.0 / 24.0)).clip(
            0, 255
        ).astype(np.uint8)

        return cv2.applyColorMap(scaled, cv2.COLORMAP_TURBO)

    @staticmethod
    def make_body_part_heatmap(iuv_image: np.ndarray) -> np.ndarray:
        labels = iuv_image[:, :, 0]
        detected = (labels > 0).astype(np.float32)
        density = cv2.GaussianBlur(detected, (0, 0), sigmaX=15)

        if density.max() > 0:
            density = density / density.max()

        heatmap = cv2.applyColorMap(
            (density * 255).astype(np.uint8),
            cv2.COLORMAP_INFERNO,
        )
        heatmap[labels == 0] = 0
        return heatmap

    @staticmethod
    def make_body_part_legend() -> list[dict]:
        legend = []

        for label, name in BODY_PARTS.items():
            scaled_label = np.uint8(label * (255.0 / 24.0))
            color_bgr = cv2.applyColorMap(
                np.array([[scaled_label]], dtype=np.uint8),
                cv2.COLORMAP_TURBO,
            )[0, 0]

            legend.append(
                {
                    "id": label,
                    "name": name,
                    "color": "#{:02x}{:02x}{:02x}".format(
                        int(color_bgr[2]),
                        int(color_bgr[1]),
                        int(color_bgr[0]),
                    ),
                }
            )

        return legend

    def process_image(
        self,
        input_path: str,
        output_dir: str = "output",
    ) -> dict:
        output = Path(output_dir)
        output.mkdir(parents=True, exist_ok=True)

        image = cv2.imread(input_path)
        if image is None:
            raise FileNotFoundError(f"Could not read image: {input_path}")

        instances, results, boxes_xywh, scores, boxes_xyxy = self.predict(image)

        overlay = image.copy()
        if results is not None and boxes_xywh is not None:
            overlay = self.visualizer.visualize(
                overlay,
                (results, boxes_xywh),
            )

        iuv = self.make_iuv_image(
            results,
            boxes_xywh,
            image.shape,
        )

        body_part_map = self.make_body_part_map(iuv)
        body_part_heatmap = self.make_body_part_heatmap(iuv)

        people = []

        if results is not None and boxes_xywh is not None:
            for idx, result in enumerate(results):
                labels = result.labels.cpu().numpy()

                # DensePose result is cropped to the detected person's box.
                bbox = boxes_xyxy[idx].tolist()
                confidence = (
                    float(scores[idx])
                    if idx < len(scores)
                    else 0.0
                )

                people.append(
                    summarize_person(
                        idx,
                        confidence,
                        bbox,
                        labels,
                    )
                )

        analysis = {
            "device": self.device,
            "input": str(input_path),
            "people_detected": len(people),
            "people": people,
            "body_part_legend": self.make_body_part_legend(),
            "iuv_definition": {
                "I": "body-part index",
                "U": "horizontal canonical surface coordinate",
                "V": "vertical canonical surface coordinate",
            },
        }

        cv2.imwrite(str(output / "densepose_overlay.png"), overlay)
        cv2.imwrite(str(output / "iuv.png"), iuv)
        cv2.imwrite(str(output / "body_part_map.png"), body_part_map)
        cv2.imwrite(str(output / "body_part_heatmap.png"), body_part_heatmap)

        with open(output / "analysis.json", "w", encoding="utf-8") as f:
            json.dump(analysis, f, indent=2)

        return analysis

    def process_video(
        self,
        input_path: str,
        output_path: str = "output/densepose_video.mp4",
        every: int = 1,
    ):
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise FileNotFoundError(f"Could not open video: {input_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if fps <= 0:
            fps = 24.0

        writer = cv2.VideoWriter(
            str(output_file),
            cv2.VideoWriter_fourcc(*"mp4v"),
            max(1.0, fps / max(1, every)),
            (width, height),
        )

        frame_number = 0

        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break

                if frame_number % max(1, every) == 0:
                    _, results, boxes_xywh, _, _ = self.predict(frame)

                    rendered = frame.copy()

                    if results is not None and boxes_xywh is not None:
                        rendered = self.visualizer.visualize(
                            rendered,
                            (results, boxes_xywh),
                        )

                    writer.write(rendered)

                frame_number += 1
        finally:
            cap.release()
            writer.release()

        return str(output_file)
