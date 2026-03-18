@echo off
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting YOLOv8 server on http://localhost:8000
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
