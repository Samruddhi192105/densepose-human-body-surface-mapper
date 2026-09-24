# DensePose Human Body Surface Mapper

A computer vision application that uses **DensePose** to map the visible human body surface into detailed body-part regions and dense surface coordinates.

The project combines **DensePose, Detectron2, PyTorch, FastAPI, Next.js, Docker, and GitHub Actions** to provide an end-to-end human body surface mapping system.

## 📌 Overview

Traditional human pose estimation identifies a limited number of body keypoints such as the shoulders, elbows, knees, and ankles.

DensePose goes further by mapping **visible human pixels** to a canonical representation of the human body surface.

This project takes an image of a person and generates:

- DensePose visualization
- IUV representation
- Body-part map
- Human detection information
- Body-part pixel analysis
- Confidence scores
- Bounding boxes

The application also provides a web interface where users can upload an image and view the generated results.

> **Note:** DensePose maps visible human regions to a canonical body surface representation. It does not reconstruct hidden body surfaces or produce a complete 3D human model from a single RGB image.

## Local Processing

Uploaded images are saved to the local `input/` directory and processed directly by the backend. Generated overlays, IUV images, body-part maps, and analysis JSON are saved under `output/`. Supabase is used only for authentication.

The original uploaded image is deleted after processing. Generated result folders are retained for one hour by default and cleaned up automatically when a later prediction starts. Configure this with `OUTPUT_RETENTION_SECONDS`.

The DensePose model is downloaded automatically during the backend Docker build, so the large model file does not need to be committed to GitHub.

For Render, use an instance with at least 1 GB RAM. The free 512 MiB instance can be killed by the operating system while loading PyTorch and DensePose, before the API opens its port.

## Run With Docker

Create a root `.env` file for Compose (do not commit it):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
ALLOWED_ORIGINS=http://localhost:3000
```

Run the application with `docker compose up --build`, then open `http://localhost:3000`. For deployment, set `NEXT_PUBLIC_API_URL` to the public HTTPS URL of the backend and `ALLOWED_ORIGINS` to the public HTTPS URL of the frontend before building. The frontend variables are public browser configuration and are intentionally supplied as Docker build arguments.

# ✨ Features

## 🧍 Human Detection

Detects people present in the input image using the pretrained DensePose model.

For every detected person, the system provides:

- Detection confidence
- Bounding box
- Person index
- Visible body regions

## 🎨 DensePose Visualization

Generates a visual overlay showing the DensePose estimation on the original image.

This provides an intuitive representation of how the detected human body surface is mapped.

### DensePose Overlay

<img width="959" height="415" alt="Screenshot 2026-09-12 122831" src="https://github.com/user-attachments/assets/a31fe200-600d-403d-8b5f-6e9225c4e5e1" />

<img width="581" height="395" alt="Screenshot 2026-09-12 122857" src="https://github.com/user-attachments/assets/61d136a0-7ba8-4b95-88a2-55fb81221f35" />

<img width="454" height="408" alt="Screenshot 2026-09-12 122910" src="https://github.com/user-attachments/assets/a09ba745-dc80-444c-ba80-a0248be5dcec" />

<img width="483" height="268" alt="Screenshot 2026-09-12 122919" src="https://github.com/user-attachments/assets/07bf3271-ef17-491a-946f-085373ed1ca1" />

## 🧩 Body-Part Mapping

The project converts DensePose's 24 fine-grained surface patches into meaningful semantic body regions.

The 24 DensePose patches are grouped into 14 body-part categories:

| Body Part | DensePose Labels |
|---|---|
| Torso | 1, 2 |
| Right Hand | 3 |
| Left Hand | 4 |
| Left Foot | 5 |
| Right Foot | 6 |
| Right Upper Leg | 7, 9 |
| Left Upper Leg | 8, 10 |
| Right Lower Leg | 11, 13 |
| Left Lower Leg | 12, 14 |
| Left Upper Arm | 15, 17 |
| Right Upper Arm | 16, 18 |
| Left Lower Arm | 19, 21 |
| Right Lower Arm | 20, 22 |
| Head | 23, 24 |

## 🌐 IUV Representation

DensePose represents each detected human pixel using three values:

### I — Body-Part Index

Identifies which DensePose body-surface patch the pixel belongs to.

### U — Horizontal Surface Coordinate

Represents the horizontal coordinate on the canonical surface of the corresponding body part.

### V — Vertical Surface Coordinate

Represents the vertical coordinate on the canonical surface of the corresponding body part.

Therefore:

```text
IUV = [Body-Part Index, U Coordinate, V Coordinate]
