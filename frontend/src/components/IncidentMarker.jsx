import { useState } from 'react';
import { Marker, OverlayView } from '@react-google-maps/api';

const TYPE_EMOJI = {
  'Accident': '🚗', 'Road Block': '🚧', 'Construction': '🏗️',
  'Heavy Traffic': '⚠️', 'Bridge Damage': '🌉', 'Flooding': '🌊',
  'Fire': '🔥', 'Fallen Tree': '🌳', 'Other': '📍',
};

const SEVERITY_COLOR = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#7c3aed' };
const SEVERITY_BG    = { Low: '#f0fdf4', Medium: '#fffbeb', High: '#fef2f2', Critical: '#faf5ff' };

const IncidentMarker = ({ incident, onClick }) => {
  const [open, setOpen] = useState(false);
  const emoji = TYPE_EMOJI[incident.type] || '📍';
  const color = SEVERITY_COLOR[incident.severity] || '#f59e0b';
  const size  = incident.severity === 'Critical' ? 44 : incident.severity === 'High' ? 40 : 36;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="white" stroke="${color}" stroke-width="3"/>
      <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" font-size="${size * 0.52}">${emoji}</text>
    </svg>
  `;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <>
      <Marker
        position={{ lat: incident.location.lat, lng: incident.location.lng }}
        icon={{
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(svg),
          // eslint-disable-next-line no-undef
          anchor: new google.maps.Point(size / 2, size / 2),
        }}
        onClick={() => { setOpen(o => !o); onClick && onClick(incident); }}
        title={`${incident.type} — ${incident.severity || 'Medium'}`}
      />

      {open && (
        <OverlayView
          position={{ lat: incident.location.lat, lng: incident.location.lng }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h + size / 2 + 8) })}
        >
          <div style={{
            background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: `2px solid ${color}`, width: 280, fontFamily: 'system-ui,sans-serif',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Header */}
            <div style={{ background: color, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 13 }}>{incident.type}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{timeAgo(incident.createdAt)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                  {incident.severity}
                </span>
                <button onClick={() => setOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Image */}
            {incident.imageUrl && (
              <img src={incident.imageUrl} alt="incident"
                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
            )}

            {/* Body */}
            <div style={{ padding: '10px 12px' }}>
              {incident.description && (
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                  {incident.description}
                </p>
              )}

              {incident.aiResult?.aiInsight && (
                <div style={{ background: SEVERITY_BG[incident.severity] || '#f8fafc', borderRadius: 8, padding: '7px 10px', marginBottom: 8, border: `1px solid ${color}33` }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#4338ca', fontWeight: 600, marginBottom: 3 }}>💡 AI Insight</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{incident.aiResult.aiInsight}</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  👤 {incident.reportedBy || 'Anonymous'}
                </span>
                {incident.verified && (
                  <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>
                    ✅ AI Verified
                  </span>
                )}
              </div>

              {incident.location.address && (
                <p style={{ margin: '6px 0 0', fontSize: 10, color: '#94a3b8' }}>
                  📍 {incident.location.address}
                </p>
              )}
            </div>
          </div>
        </OverlayView>
      )}
    </>
  );
};

export default IncidentMarker;
