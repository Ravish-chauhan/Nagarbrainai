from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import numpy as np
import cv2
from ultralytics import YOLO

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

vehicle_model   = YOLO("yolov8n.pt")
ambulance_model = YOLO("runs/detect/ambulance_model/weights/best.pt")  # local model — mAP50=98.8%, classes: ambulance/siren

VEHICLE_CLASSES   = {"car", "truck", "bus", "motorcycle", "bicycle"}
EMERGENCY_CLASSES = {"ambulance"}  # ignore 'siren' class — too many false positives on lights

INFER_SIZE = 640  # both models run at 640×640

def get_density(count: int) -> str:
    if count >= 10: return "High"
    if count >= 4:  return "Medium"
    return "Low"

def letterbox(img, size=INFER_SIZE):
    """Resize keeping aspect ratio, pad to square. Returns (padded_img, scale, pad_x, pad_y)."""
    h, w = img.shape[:2]
    scale = size / max(h, w)
    nh, nw = int(h * scale), int(w * scale)
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((size, size, 3), 114, dtype=np.uint8)
    pad_y, pad_x = (size - nh) // 2, (size - nw) // 2
    canvas[pad_y:pad_y + nh, pad_x:pad_x + nw] = resized
    return canvas, scale, pad_x, pad_y

def unpad_box(x1, y1, x2, y2, scale, pad_x, pad_y, orig_w, orig_h):
    """Convert letterboxed coords back to original image fraction [0,1]."""
    x1 = max(0.0, (x1 - pad_x) / scale / orig_w)
    y1 = max(0.0, (y1 - pad_y) / scale / orig_h)
    x2 = min(1.0, (x2 - pad_x) / scale / orig_w)
    y2 = min(1.0, (y2 - pad_y) / scale / orig_h)
    return round(x1, 4), round(y1, 4), round(x2, 4), round(y2, 4)

def box_iou(a, b):
    ix1, iy1 = max(a["x1"], b["x1"]), max(a["y1"], b["y1"])
    ix2, iy2 = min(a["x2"], b["x2"]), min(a["y2"], b["y2"])
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    aA = (a["x2"] - a["x1"]) * (a["y2"] - a["y1"])
    aB = (b["x2"] - b["x1"]) * (b["y2"] - b["y1"])
    return inter / (aA + aB - inter + 1e-6)

class FrameRequest(BaseModel):
    frameBase64: str
    laneId: int = 0

@app.post("/detect")
async def detect(req: FrameRequest):
    try:
        img_data = base64.b64decode(req.frameBase64.split(",")[-1])
        frame    = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        orig_h, orig_w = frame.shape[:2]
        lb_frame, scale, pad_x, pad_y = letterbox(frame)
        boxes = []

        # ── Vehicle detection ────────────────────────────────────────────
        vehicle_count = 0
        for det in vehicle_model(lb_frame, verbose=False, conf=0.45, imgsz=INFER_SIZE)[0].boxes:
            cls_name = vehicle_model.names[int(det.cls[0])].lower()
            if cls_name not in VEHICLE_CLASSES:
                continue
            vehicle_count += 1
            x1, y1, x2, y2 = det.xyxy[0].tolist()
            nx1, ny1, nx2, ny2 = unpad_box(x1, y1, x2, y2, scale, pad_x, pad_y, orig_w, orig_h)
            boxes.append({
                "label": cls_name,
                "conf":  round(float(det.conf[0]) * 100),
                "x1": nx1, "y1": ny1, "x2": nx2, "y2": ny2,
            })

        # ── Ambulance / emergency detection ──────────────────────────────
        emergency_detected = False
        for det in ambulance_model(lb_frame, verbose=False, conf=0.60, imgsz=INFER_SIZE)[0].boxes:
            cls_name = ambulance_model.names[int(det.cls[0])].lower()
            if cls_name not in EMERGENCY_CLASSES:
                continue
            x1, y1, x2, y2 = det.xyxy[0].tolist()
            nx1, ny1, nx2, ny2 = unpad_box(x1, y1, x2, y2, scale, pad_x, pad_y, orig_w, orig_h)
            amb_box = {"label": "ambulance", "conf": round(float(det.conf[0]) * 100),
                       "x1": nx1, "y1": ny1, "x2": nx2, "y2": ny2}
            # suppress any vehicle box that heavily overlaps this ambulance
            boxes = [b for b in boxes if box_iou(b, amb_box) < 0.45]
            emergency_detected = True
            boxes.append(amb_box)

        return {
            "laneId":            req.laneId,
            "vehicleCount":      vehicle_count,
            "density":           get_density(vehicle_count),
            "emergencyDetected": emergency_detected,
            "boxes":             boxes,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "model": "yolov8n + ambulance_model"}
