import { useEffect, useRef, useState, useCallback } from 'react';
import TrafficLight from './TrafficLight';

const YOLO_API = 'http://localhost:8000/detect';

const BOX_COLORS = {
  car: '#3b82f6',
  truck: '#8b5cf6',
  bus: '#f59e0b',
  motorcycle: '#10b981',
  bicycle: '#06b6d4',
  ambulance: '#ef4444',
};



const LaneBox = ({ laneId, label, dir, signalState, secondsLeft, onDetection, bulkSrc, laneStats }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef({ count: 0, last: Date.now() });
  const emergencyUntilRef = useRef(0);            // sticky emergency timestamp
  const EMERGENCY_STICKY_MS = 8000;               // keep emergency active for 8s

  const drawBoxes = useCallback((detBoxes) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const dw = video.clientWidth;
    const dh = video.clientHeight;
    canvas.width = dw;
    canvas.height = dh;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);

    // Video uses object-fit:cover — compute the visible crop region
    const vw = video.videoWidth  || dw;
    const vh = video.videoHeight || dh;
    const scale = Math.max(dw / vw, dh / vh);
    const rendW = vw * scale;
    const rendH = vh * scale;
    const offX = (dw - rendW) / 2;   // negative = cropped left
    const offY = (dh - rendH) / 2;   // negative = cropped top

    // Boxes are fractions of the original video frame — map through cover transform
    detBoxes.forEach(({ label: lbl, conf, x1, y1, x2, y2 }) => {
      // convert from fraction-of-video to canvas pixels
      x1 = offX + x1 * rendW;
      y1 = offY + y1 * rendH;
      x2 = offX + x2 * rendW;
      y2 = offY + y2 * rendH;
      const color = BOX_COLORS[lbl] || '#6366f1';
      const px1 = x1, py1 = y1, px2 = x2, py2 = y2;
      const pw = px2 - px1;
      const ph = py2 - py1;

      ctx.fillStyle = `${color}22`;
      ctx.fillRect(px1, py1, pw, ph);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px1, py1, pw, ph);

      const cs = Math.min(pw, ph, 10);
      ctx.lineWidth = 2.5;
      [[px1, py1, 1, 1], [px2, py1, -1, 1], [px1, py2, 1, -1], [px2, py2, -1, -1]].forEach(([cx, cy, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + sx * cs, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + sy * cs);
        ctx.stroke();
      });

      const text = `${lbl} ${conf}%`;
      ctx.font = 'bold 9px Inter, sans-serif';
      const tw = ctx.measureText(text).width + 6;
      const ly = py1 > 16 ? py1 - 4 : py2 + 14;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(px1, ly - 12, tw, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(text, px1 + 3, ly);
    });
  }, []);

  const detectFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended || !videoLoaded) return;

    // Preserve natural aspect ratio so backend letterbox coords match
    const vw = video.videoWidth  || 640;
    const vh = video.videoHeight || 480;
    const scale = Math.min(640 / vw, 640 / vh);
    const tw = Math.round(vw * scale);
    const th = Math.round(vh * scale);
    const tmp = document.createElement('canvas');
    tmp.width = tw;
    tmp.height = th;
    tmp.getContext('2d').drawImage(video, 0, 0, tw, th);
    const frameBase64 = tmp.toDataURL('image/jpeg', 0.85);

    try {
      const res = await fetch(YOLO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameBase64, laneId }),
      });
      const data = await res.json();

      drawBoxes(data.boxes || []);

      // ── Sticky emergency: once detected, keep flag active for 5s ──
      const now = Date.now();
      if (data.emergencyDetected) {
        emergencyUntilRef.current = now + EMERGENCY_STICKY_MS;
      }
      const isEmergencyActive = now < emergencyUntilRef.current;
      const enrichedData = {
        ...data,
        emergencyDetected: data.emergencyDetected || isEmergencyActive,
      };
      onDetection(laneId, enrichedData);

      fpsRef.current.count++;
      if (now - fpsRef.current.last >= 1000) {
        setFps(fpsRef.current.count);
        fpsRef.current = { count: 0, last: now };
      }
    } catch { /* server offline */ }
  }, [videoLoaded, laneId, drawBoxes, onDetection]);

  useEffect(() => {
    if (videoLoaded) intervalRef.current = setInterval(detectFrame, 500);
    return () => clearInterval(intervalRef.current);
  }, [videoLoaded, detectFrame]);

  useEffect(() => {
    if (!bulkSrc) return;
    if (videoRef.current) { videoRef.current.src = bulkSrc; videoRef.current.load(); }
    setVideoLoaded(false);
    canvasRef.current?.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, [bulkSrc]);

  const handleVideoLoad = () => { setVideoLoaded(true); videoRef.current?.play(); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (videoRef.current) { videoRef.current.src = URL.createObjectURL(file); videoRef.current.load(); }
    setVideoLoaded(false);
    canvasRef.current?.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const { vehicleCount = 0, density = 'Low', emergencyDetected = false, ambulanceCount = 0 } = laneStats || {};

  const densityColor = density === 'High' ? '#ef4444' : density === 'Medium' ? '#f59e0b' : '#10b981';
  const signalAccent = signalState === 'green' ? '#10b981' : signalState === 'yellow' ? '#f59e0b' : '#ef4444';
  const isActive = signalState !== 'red';

  return (
    <div className={`lane-card ${emergencyDetected ? 'emergency' : ''} ${isActive ? 'active' : ''}`}
      style={{ '--accent': signalAccent }}>

      {/* ── Card header ── */}
      <div className="lane-header">
        <div className="lane-title-group">
          <div className="lane-dot" style={{ background: signalAccent }} />
          <span className="lane-label">{label}</span>
          <span className="lane-dir">{dir}</span>
        </div>
        <div className="lane-header-right">
          {emergencyDetected && <span className="amb-badge">🚑 AMBULANCE</span>}
          <span className="fps-badge">{fps} fps</span>
        </div>
      </div>

      {/* ── Video + traffic light ── */}
      <div className="lane-video-row">
        <div className="lane-light-col">
          <TrafficLight state={signalState} secondsLeft={secondsLeft} />
        </div>
        <div className="lane-video-wrap">
          <video
            ref={videoRef}
            className="lane-video"
            muted loop playsInline
            onLoadedData={handleVideoLoad}
          />
          <canvas ref={canvasRef} className="lane-canvas" />

          {!videoLoaded && (
            <label className="lane-upload-overlay">
              <span className="upload-icon">📹</span>
              <span className="upload-text">Click to add video</span>
              <span className="upload-sub">MP4 · MOV · AVI</span>
              <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
            </label>
          )}
          {videoLoaded && (
            <label className="lane-change-btn">
              ⟳ change
              <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
            </label>
          )}
        </div>
      </div>

      {/* ── Inline stats bar ── */}
      <div className="lane-stats-bar">
        <div className="lane-stat">
          <span className="stat-num">{vehicleCount}</span>
          <span className="stat-lbl">Vehicles</span>
        </div>
        <div className="stat-sep" />
        <div className="lane-stat">
          <span className="stat-num" style={{ color: densityColor }}>{density}</span>
          <span className="stat-lbl">Density</span>
        </div>
        <div className="stat-sep" />
        <div className="lane-stat">
          <span className="stat-num" style={{ color: ambulanceCount > 0 ? '#ef4444' : '#94a3b8' }}>
            {ambulanceCount}
          </span>
          <span className="stat-lbl">Ambulance</span>
        </div>
        <div className="stat-sep" />
        <div className="lane-stat">
          <span className="stat-num" style={{ color: signalAccent }}>{signalState.toUpperCase()}</span>
          <span className="stat-lbl">Signal</span>
        </div>
      </div>
    </div>
  );
};

export default LaneBox;
