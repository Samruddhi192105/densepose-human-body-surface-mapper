@echo off
if "%~1"=="" (
    echo Usage: run_image.bat input\person.jpg
    exit /b 1
)

docker run --rm ^
  -v "%cd%\input:/workspace/input" ^
  -v "%cd%\output:/workspace/output" ^
  densepose-mapper ^
  python -m app.cli image --input /workspace/%~1

echo.
echo Results are in the output folder.
