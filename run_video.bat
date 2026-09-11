@echo off
if "%~1"=="" (
    echo Usage: run_video.bat input\person.mp4
    exit /b 1
)

docker run --rm ^
  -v "%cd%\input:/workspace/input" ^
  -v "%cd%\output:/workspace/output" ^
  densepose-mapper ^
  python -m app.cli video --input /workspace/%~1

echo.
echo Video result is in the output folder.
