# DensePose Human Body Surface Mapper

Day 6 computer-vision project: use a pretrained DensePose-RCNN model to map human pixels in an image/video to a canonical human surface representation.

## What this project demonstrates

Input:
- One human image, or
- A video containing people

Output:
1. Original image
2. DensePose fine-segmentation visualization
3. IUV representation
4. Body-part coverage analysis
5. Detection confidence and bounding-box information

The project does **not** train DensePose from scratch. It downloads the official pretrained DensePose-RCNN R50-FPN model automatically on first inference.

## Important Windows note

The official Detectron2 installation documentation lists Linux/macOS support and Detectron2 is normally built from source. For Windows, the most reliable setup for this project is **Docker Desktop with WSL2** rather than trying to compile Detectron2 directly in native Windows Python.

This project therefore includes a Docker setup.

## Architecture

```text
Image / Video
      |
      v
Detectron2
      |
      v
DensePose-RCNN pretrained model
      |
      +------------------+
      |                  |
      v                  v
Human detection     DensePose head
                         |
                         v
                    I, U, V maps
                         |
              +----------+----------+
              |                     |
              v                     v
       Visualization         Body-part analysis
```

## DensePose concept

Normal pose estimation might predict a limited number of keypoints:

```text
nose, shoulders, elbows, wrists, hips, knees, ankles...
```

DensePose instead predicts a dense correspondence over the visible human surface.

For every predicted human pixel:

```text
I = body-part index
U = horizontal coordinate on that body-part surface
V = vertical coordinate on that body-part surface
```

The model uses 24 semantic body-part labels in the DensePose chart representation.

## Project structure

```text
densepose-human-body-surface-mapper/
│
├── app/
│   ├── __init__.py
│   ├── densepose_mapper.py
│   ├── analyze.py
│   └── cli.py
│
├── input/
│   └── .gitkeep
│
├── output/
│   └── .gitkeep
│
├── Dockerfile.cpu
├── Dockerfile.gpu
├── docker-compose.yml
├── requirements.txt
├── .dockerignore
├── .gitignore
└── README.md
```

## Option A — Docker CPU

This is the easiest setup if you do not want to configure CUDA.

### 1. Install

You need:
- Docker Desktop
- WSL2 enabled on Windows

### 2. Build

From this folder:

```bash
docker build -f Dockerfile.cpu -t densepose-mapper .
```

### 3. Run an image

Put an image inside:

```text
input/person.jpg
```

Then:

```bash
docker run --rm \
  -v "${PWD}/input:/workspace/input" \
  -v "${PWD}/output:/workspace/output" \
  densepose-mapper \
  python -m app.cli image --input /workspace/input/person.jpg
```

On Windows PowerShell, if `${PWD}` causes issues, use the absolute project path.

Example:

```powershell
docker run --rm -v "D:\densepose-human-body-surface-mapper\input:/workspace/input" -v "D:\densepose-human-body-surface-mapper\output:/workspace/output" densepose-mapper python -m app.cli image --input /workspace/input/person.jpg
```

CPU inference can be slow. That is normal for DensePose.

## Option B — Docker + NVIDIA GPU

If your laptop has a supported NVIDIA GPU and Docker Desktop has GPU access configured:

```bash
docker build -f Dockerfile.gpu -t densepose-mapper-gpu .
```

Run:

```bash
docker run --rm --gpus all \
  -v "${PWD}/input:/workspace/input" \
  -v "${PWD}/output:/workspace/output" \
  densepose-mapper-gpu \
  python -m app.cli image --input /workspace/input/person.jpg
```

GPU inference is strongly preferred for video.

## Image inference

```bash
python -m app.cli image --input input/person.jpg
```

Optional confidence threshold:

```bash
python -m app.cli image --input input/person.jpg --threshold 0.7
```

Output files:

```text
output/
├── densepose_overlay.png
├── iuv.png
├── body_part_map.png
└── analysis.json
```

## Video inference

```bash
python -m app.cli video --input input/person.mp4
```

Optional frame sampling:

```bash
python -m app.cli video --input input/person.mp4 --every 2
```

This processes every 2nd frame.

## Understanding the outputs

### 1. DensePose overlay

The original person image is covered by a colored DensePose segmentation map.

Different colors correspond to different body regions.

### 2. IUV image

The three channels represent:

```text
Channel 0 -> I
Channel 1 -> U
Channel 2 -> V
```

I is discrete body-part identity.

U and V are continuous surface coordinates.

### 3. Body-part map

The project converts the predicted I channel into a visualization showing where DensePose assigned body-part labels.

### 4. analysis.json

Example structure:

```json
{
  "people_detected": 1,
  "people": [
    {
      "person_index": 0,
      "confidence": 0.98,
      "bbox_xyxy": [120, 50, 510, 900],
      "visible_body_parts": [1, 2, 3, 4]
    }
  ]
}
```

## Why IUV matters for virtual try-on

A normal bounding box tells you:

```text
"The person is here."
```

A pose keypoint detector tells you:

```text
"The elbow is here."
```

DensePose gives richer information:

```text
"This pixel belongs to the left lower arm,
and this pixel corresponds to a particular
location on the canonical arm surface."
```

That makes DensePose useful for applications such as:

- virtual try-on
- garment warping
- body-aware image editing
- human parsing
- pose-conditioned generation
- clothing transfer
- human surface correspondence

DensePose alone is **not** a complete virtual try-on system. It provides geometric/body correspondence information that can be used by later stages.

## What to explain in an interview

### What is DensePose?

DensePose is a dense human pose estimation method that maps pixels of a human image to a canonical 3D body surface representation.

### Pose estimation vs DensePose

Pose estimation:

```text
few semantic keypoints
```

DensePose:

```text
dense pixel-to-surface correspondence
```

### What is IUV?

```text
I = body-part index
U = horizontal coordinate
V = vertical coordinate
```

### Why use a pretrained model?

DensePose is a large deep-learning system trained on human annotations. For an application project, training it from scratch would require a large dataset, substantial GPU compute, and significant training time. A pretrained model lets us focus on inference and understanding the representation.

## Technical flow

1. Read image with OpenCV.
2. Build Detectron2 configuration.
3. Add DensePose configuration.
4. Load pretrained DensePose-RCNN R50-FPN weights.
5. Run human detection.
6. Run DensePose prediction on detected humans.
7. Extract chart results.
8. Read `labels`, `U`, and `V`.
9. Build IUV output.
10. Visualize body-part segmentation.
11. Calculate per-person body-part coverage.
12. Save JSON analysis.

## Important limitation

DensePose predicts visible surface correspondence. It does not magically recover the exact hidden/back side of a person from one RGB image.

## References

- Detectron2: https://github.com/facebookresearch/detectron2
- DensePose project inside Detectron2: https://github.com/facebookresearch/detectron2/tree/main/projects/DensePose
- DensePose model zoo: https://github.com/facebookresearch/detectron2/blob/main/projects/DensePose/doc/MODEL_ZOO.md
