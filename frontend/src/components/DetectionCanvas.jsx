import { useEffect, useRef } from 'react';

// Box colors per label type
const BOX_STYLE = {
  vehicle:   { stroke: '#4f8ef7', fill: 'rgba(79,142,247,0.12)',  label: '#4f8ef7' },
  accident:  { stroke: '#ef4444', fill: 'rgba(239,68,68,0.15)',   label: '#ef4444' },
  ambulance: { stroke: '#f97316', fill: 'rgba(249,115,22,0.15)',  label: '#f97316' },
};

const DetectionCanvas = ({ imageSrc, detections, imageNaturalSize }) => {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);

  useEffect(() => {
    if (!imageSrc || !detections) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const draw = () => {
      const displayW = img.clientWidth;
      const displayH = img.clientHeight;
      const naturalW = imageNaturalSize?.w || img.naturalWidth;
      const naturalH = imageNaturalSize?.h || img.naturalHeight;

      canvas.width  = displayW;
      canvas.height = displayH;

      const scaleX = displayW / naturalW;
      const scaleY = displayH / naturalH;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, displayW, displayH);

      const allBoxes = [
        ...(detections.vehicles  || []).map(d => ({ ...d, type: 'vehicle' })),
        ...(detections.accidents || []).map(d => ({ ...d, type: 'accident' })),
        ...(detections.ambulances|| []).map(d => ({ ...d, type: 'ambulance' })),
      ];

      allBoxes.forEach(({ box, score, type }) => {
        if (!box) return;
        const style = BOX_STYLE[type] || BOX_STYLE.vehicle;

        // API returns xmin,ymin,xmax,ymax in natural image pixels
        const x = box.xmin * scaleX;
        const y = box.ymin * scaleY;
        const w = (box.xmax - box.xmin) * scaleX;
        const h = (box.ymax - box.ymin) * scaleY;

        // Fill
        ctx.fillStyle = style.fill;
        ctx.fillRect(x, y, w, h);

        // Border
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Corner accents (like YOLO style)
        const cs = Math.min(w, h, 14); // corner size
        ctx.lineWidth = 3;
        ctx.strokeStyle = style.stroke;
        // top-left
        ctx.beginPath(); ctx.moveTo(x, y + cs); ctx.lineTo(x, y); ctx.lineTo(x + cs, y); ctx.stroke();
        // top-right
        ctx.beginPath(); ctx.moveTo(x + w - cs, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cs); ctx.stroke();
        // bottom-left
        ctx.beginPath(); ctx.moveTo(x, y + h - cs); ctx.lineTo(x, y + h); ctx.lineTo(x + cs, y + h); ctx.stroke();
        // bottom-right
        ctx.beginPath(); ctx.moveTo(x + w - cs, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cs); ctx.stroke();

        // Label pill
        const label = `${type} ${score}%`;
        ctx.font = 'bold 11px Inter, sans-serif';
        const textW = ctx.measureText(label).width + 10;
        const labelY = y > 20 ? y - 6 : y + h + 18;

        ctx.fillStyle = style.stroke;
        ctx.beginPath();
        ctx.roundRect(x, labelY - 14, textW, 18, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 5, labelY);
      });
    };

    if (img.complete) draw();
    else img.onload = draw;

    // Redraw on resize
    const ro = new ResizeObserver(draw);
    ro.observe(img);
    return () => ro.disconnect();
  }, [imageSrc, detections, imageNaturalSize]);

  return (
    <div className="relative w-full">
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Detection"
        className="w-full rounded-lg"
        style={{ display: 'block' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"
      />
    </div>
  );
};

export default DetectionCanvas;
