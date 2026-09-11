from __future__ import annotations

from typing import Dict, List
import numpy as np


# DensePose's chart representation uses 24 semantic body-part labels.
BODY_PARTS = {
    1: "torso",
    2: "torso",

    3: "right_hand",
    4: "left_hand",

    5: "left_foot",
    6: "right_foot",

    7: "right_upper_leg",
    8: "left_upper_leg",
    9: "right_upper_leg",
    10: "left_upper_leg",

    11: "right_lower_leg",
    12: "left_lower_leg",
    13: "right_lower_leg",
    14: "left_lower_leg",

    15: "left_upper_arm",
    16: "right_upper_arm",
    17: "left_upper_arm",
    18: "right_upper_arm",

    19: "left_lower_arm",
    20: "right_lower_arm",
    21: "left_lower_arm",
    22: "right_lower_arm",

    23: "head",
    24: "head",
}


def summarize_labels(labels: np.ndarray) -> Dict[str, int]:
    labels = labels.astype(np.int32)
    result: Dict[str, int] = {}

    for label in np.unique(labels):
        if label <= 0:
            continue
        name = BODY_PARTS.get(int(label), f"part_{int(label)}")
        result[name] = int(np.sum(labels == label))

    return dict(sorted(result.items(), key=lambda item: item[0]))

def summarize_person(
    person_index,
    confidence,
    bbox,
    labels,
):
    pixel_count_by_body_part = {}

    for label in labels.flatten():
        if label == 0:
            continue

        part_name = BODY_PARTS.get(int(label), "unknown")

        pixel_count_by_body_part[part_name] = (
            pixel_count_by_body_part.get(part_name, 0) + 1
        )

    return {
        "person_index": person_index,
        "confidence": round(confidence, 4),
        "bbox_xyxy": [round(float(x), 2) for x in bbox],
        "visible_body_parts": sorted(
            pixel_count_by_body_part.keys()
        ),
        "pixel_count_by_body_part": pixel_count_by_body_part,
        "densepose_pixels": int(
            sum(pixel_count_by_body_part.values())
        ),
    }