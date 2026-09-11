from __future__ import annotations

import argparse
import json

from .densepose_mapper import DensePoseMapper


def build_parser():
    parser = argparse.ArgumentParser(
        description="DensePose Human Body Surface Mapper"
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    image_parser = subparsers.add_parser(
        "image",
        help="Run DensePose on one image",
    )
    image_parser.add_argument(
        "--input",
        required=True,
        help="Path to input image",
    )
    image_parser.add_argument(
        "--output-dir",
        default="output",
        help="Directory for generated files",
    )
    image_parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Human detection confidence threshold",
    )

    video_parser = subparsers.add_parser(
        "video",
        help="Run DensePose on a video",
    )
    video_parser.add_argument(
        "--input",
        required=True,
        help="Path to input video",
    )
    video_parser.add_argument(
        "--output",
        default="output/densepose_video.mp4",
        help="Output video path",
    )
    video_parser.add_argument(
        "--every",
        type=int,
        default=1,
        help="Process every Nth frame",
    )
    video_parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Human detection confidence threshold",
    )

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    mapper = DensePoseMapper(threshold=args.threshold)

    if args.command == "image":
        analysis = mapper.process_image(
            input_path=args.input,
            output_dir=args.output_dir,
        )

        print("\nDensePose completed.")
        print(f"Device: {analysis['device']}")
        print(f"People detected: {analysis['people_detected']}")
        print("\nAnalysis:")
        print(json.dumps(analysis, indent=2))

    elif args.command == "video":
        output = mapper.process_video(
            input_path=args.input,
            output_path=args.output,
            every=args.every,
        )

        print("\nDensePose video completed.")
        print(f"Output: {output}")


if __name__ == "__main__":
    main()
