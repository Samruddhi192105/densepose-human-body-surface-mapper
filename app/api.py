from __future__ import annotations

import os
import shutil
import threading
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .densepose_mapper import DensePoseMapper


app = FastAPI(
    title="DensePose Human Body Surface Mapper",
    description="API for human body surface mapping using DensePose.",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# DensePose model
# ---------------------------------------------------------

mapper = DensePoseMapper(threshold=0.5)


# ---------------------------------------------------------
# Storage
# ---------------------------------------------------------

BASE_DIR = Path("/workspace")

INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"

INPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

try:
    OUTPUT_RETENTION_SECONDS = max(
        60,
        int(os.getenv("OUTPUT_RETENTION_SECONDS", "3600")),
    )
except ValueError:
    OUTPUT_RETENTION_SECONDS = 3600


def remove_expired_outputs() -> None:
    cutoff = time.time() - OUTPUT_RETENTION_SECONDS

    for output_dir in OUTPUT_DIR.iterdir():
        if not output_dir.is_dir():
            continue

        try:
            if output_dir.stat().st_mtime < cutoff:
                shutil.rmtree(output_dir)
        except FileNotFoundError:
            continue
        except OSError:
            continue


def remove_output_directory(output_dir: Path) -> None:
    try:
        shutil.rmtree(output_dir)
    except FileNotFoundError:
        pass
    except OSError:
        pass


# ---------------------------------------------------------
# Basic endpoints
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "DensePose Human Body Surface Mapper API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "device": mapper.device,
    }


# ---------------------------------------------------------
# Protected DensePose endpoint
# ---------------------------------------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided.",
        )

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Use JPG, JPEG, PNG, or WEBP.",
        )

    remove_expired_outputs()

    request_id = uuid.uuid4().hex

    input_path = INPUT_DIR / f"{request_id}{extension}"
    output_dir = OUTPUT_DIR / request_id

    try:
        with input_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        analysis = mapper.process_image(
            input_path=str(input_path),
            output_dir=str(output_dir),
        )

        threading.Timer(
            OUTPUT_RETENTION_SECONDS,
            remove_output_directory,
            args=(output_dir,),
        ).start()

        return {
            "status": "success",
            "analysis": analysis,
            "results": {
                "densepose_overlay": (
                    f"/results/{request_id}/densepose_overlay.png"
                ),
                "iuv": f"/results/{request_id}/iuv.png",
                "body_part_map": (
                    f"/results/{request_id}/body_part_map.png"
                ),
            },
        }

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"DensePose processing failed: {exc}",
        )

    finally:
        try:
            input_path.unlink(missing_ok=True)
        except OSError:
            pass


# ---------------------------------------------------------
# Result files
# ---------------------------------------------------------

@app.get("/results/{request_id}/{filename}")
def get_result(
    request_id: str,
    filename: str,
):
    try:
        uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid request ID.",
        )

    allowed_files = {
        "densepose_overlay.png",
        "iuv.png",
        "body_part_map.png",
        "analysis.json",
    }

    if filename not in allowed_files:
        raise HTTPException(
            status_code=404,
            detail="Result file not found.",
        )

    file_path = OUTPUT_DIR / request_id / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Result file not found.",
        )

    return FileResponse(file_path)