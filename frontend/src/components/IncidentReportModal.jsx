import { useState, useCallback, useRef } from 'react';
import { X, MapPin, AlertTriangle, Navigation, Move, Sparkles, ImagePlus } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const INCIDENT_TYPES = [
  { value: 'Accident',      emoji: '🚗', label: 'Accident' },
  { value: 'Road Block',    emoji: '🚧', label: 'Road Block' },
  { value: 'Construction',  emoji: '🏗️', label: 'Construction' },
  { value: 'Heavy Traffic', emoji: '⚠️', label: 'Heavy Traffic' },
  { value: 'Bridge Damage', emoji: '🌉', label: 'Bridge Damage' },
  { value: 'Flooding',      emoji: '🌊', label: 'Flooding' },
  { value: 'Fire',          emoji: '🔥', label: 'Fire' },
  { value: 'Fallen Tree',   emoji: '🌳', label: 'Fallen Tree' },
  { value: 'Other',         emoji: '📍', label: 'Other' },
];

const SEVERITY_CONFIG = {
  Low:      { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  Medium:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  High:     { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  Critical: { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
};

const analyzeWithGemini = async (imageBase64, mimeType, type, description) => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const prompt = `You are an AI assistant for a smart city incident reporting system.

Incident Category: ${type}
Reporter Description: "${description}"

Analyze the uploaded image and respond in this exact JSON format:
{
  "imageMatchesReport": true/false,
  "matchConfidence": "High/Medium/Low",
  "severity": "Low/Medium/High/Critical",
  "severityReason": "one sentence why",
  "aiInsight": "2-3 sentence actionable insight about this incident",
  "verificationStatus": "Verified/Unverified/Suspicious"
}

Set verificationStatus to "Suspicious" if the image clearly does not match the reported category.
Only respond with the JSON, no extra text.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } }
        ]}]
      })
    }
  );
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
};

const autoSeverity = (type, desc) => {
  const text = `${type} ${desc}`.toLowerCase();
  if (type === 'Bridge Damage' || type === 'Fire' ||
      text.includes('fatal') || text.includes('dead') || text.includes('collapse') ||
      text.includes('major') || text.includes('severe') || text.includes('critical'))
    return 'Critical';
  if (type === 'Accident' || type === 'Flooding' ||
      text.includes('injur') || text.includes('block') || text.includes('flood') ||
      text.includes('high') || text.includes('serious'))
    return 'High';
  if (type === 'Construction' || type === 'Fallen Tree' ||
      text.includes('slow') || text.includes('minor') || text.includes('partial'))
    return 'Low';
  return 'Medium';
};

const IncidentReportModal = ({ onClose, onSubmit, onPickOnMap, pickedLocation }) => {
  const [type,         setType]         = useState('Accident');
  const [description,  setDescription]  = useState('');
  const [locMode,      setLocMode]      = useState('search');
  const [locSearch,    setLocSearch]    = useState('');
  const [location,     setLocation]     = useState(pickedLocation || null);
  const [geocoding,    setGeocoding]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [image,        setImage]        = useState(null);
  const [aiResult,     setAiResult]     = useState(null);
  const [analyzing,    setAnalyzing]    = useState(false);
  const fileRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImage({ base64: dataUrl.split(',')[1], mimeType: file.type, preview: dataUrl });
      setAiResult(null);
    };
    reader.readAsDataURL(file);
  };

  const runGeminiAnalysis = async () => {
    if (!image) return;
    setAnalyzing(true);
    setAiResult(null);
    try {
      const result = await analyzeWithGemini(image.base64, image.mimeType, type, description);
      setAiResult(result);
    } catch {
      setAiResult({ error: 'Gemini analysis failed. Check your API key.' });
    }
    setAnalyzing(false);
  };

  const handleMarkerDrag = useCallback((e) => {
    const lat = e.latLng.lat(), lng = e.latLng.lng();
    // eslint-disable-next-line no-undef
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      const address = status === 'OK' && results[0] ? results[0].formatted_address : '';
      setLocation({ lat, lng, address });
    });
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────
  const missingImage       = !image;
  const missingDescription = description.trim().length < 10;
  const notVerified        = !aiResult || !!aiResult.error;
  const isSuspicious       = aiResult?.verificationStatus === 'Suspicious';
  const canSubmit          = !missingImage && !missingDescription && !notVerified && !isSuspicious && !!location && !submitting;

  const submitBlockReason = !location          ? '📍 Set a location to continue'
    : missingImage                             ? '📷 Photo evidence is required'
    : missingDescription                       ? '📝 Description must be at least 10 characters'
    : notVerified                              ? '🤖 Run AI verification before submitting'
    : isSuspicious                             ? '🚫 Image does not match the reported incident — re-upload a correct photo'
    : null;

  const severity = aiResult?.severity || autoSeverity(type, description);
  const sev = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Medium;

  if (pickedLocation && (!location || location.lat !== pickedLocation.lat || location.lng !== pickedLocation.lng)) {
    setLocation(pickedLocation);
    setLocMode('map');
  }

  const geocodeSearch = () => {
    if (!locSearch.trim()) return;
    setGeocoding(true);
    // eslint-disable-next-line no-undef
    new google.maps.Geocoder().geocode({ address: locSearch }, (results, status) => {
      setGeocoding(false);
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        setLocation({ lat: loc.lat(), lng: loc.lng(), address: results[0].formatted_address });
      } else {
        alert('Location not found. Try a more specific address.');
      }
    });
  };

  const useGPS = () => {
    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        // eslint-disable-next-line no-undef
        new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
          setGeocoding(false);
          const address = status === 'OK' && results[0] ? results[0].formatted_address : '';
          setLocation({ lat, lng, address });
          setLocMode('gps');
        });
      },
      () => { setGeocoding(false); alert('GPS unavailable.'); }
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({ type, description, location, reportedBy: reporterName || 'Anonymous', image: image?.preview || null, aiResult: aiResult || null });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="inc-modal-overlay">
      <div className="inc-modal">

        {/* Header */}
        <div className="inc-modal-header">
          <div className="flex items-center gap-3">
            <div className="inc-modal-icon"><AlertTriangle size={18} color="#fff" /></div>
            <div>
              <h2 className="inc-modal-title">Report Incident</h2>
              <p className="inc-modal-sub">Photo + AI verification required</p>
            </div>
          </div>
          <button onClick={onClose} className="amb-close"><X size={18} /></button>
        </div>

        <div className="inc-modal-body">

          {/* Type grid */}
          <div>
            <p className="inc-section-label">Incident Type</p>
            <div className="inc-type-grid">
              {INCIDENT_TYPES.map(t => (
                <button key={t.value}
                  onClick={() => { setType(t.value); setAiResult(null); }}
                  className={`inc-type-btn ${type === t.value ? 'active' : ''}`}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description — mandatory */}
          <div>
            <p className="inc-section-label">
              Description <span style={{ color: '#ef4444' }}>*</span>
              <span className="text-slate-400 font-normal"> (min 10 characters)</span>
            </p>
            <textarea className="amb-input" rows={2}
              placeholder="e.g. Major accident blocking 2 lanes, injuries reported…"
              value={description}
              onChange={e => { setDescription(e.target.value); setAiResult(null); }}
              style={{ borderColor: missingDescription && description.length > 0 ? '#fca5a5' : '' }}
            />
            {description.length > 0 && missingDescription && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>
                {10 - description.trim().length} more characters needed
              </p>
            )}
          </div>

          {/* Image Upload + Gemini AI — mandatory */}
          <div>
            <p className="inc-section-label">
              Photo Evidence <span style={{ color: '#ef4444' }}>*</span>
              <span className="text-slate-400 font-normal"> (AI verified)</span>
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 90, height: 80, borderRadius: 10,
                  border: `2px dashed ${missingImage ? '#fca5a5' : '#cbd5e1'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', background: '#f8fafc', flexShrink: 0, overflow: 'hidden',
                }}
              >
                {image
                  ? <img src={image.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <><ImagePlus size={20} color="#94a3b8" /><span style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Upload</span></>}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {image && (
                  <button onClick={runGeminiAnalysis} disabled={analyzing || missingDescription}
                    style={{
                      padding: '8px 14px', borderRadius: 8, border: 'none',
                      cursor: analyzing || missingDescription ? 'not-allowed' : 'pointer',
                      background: analyzing ? '#e2e8f0' : missingDescription ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: analyzing || missingDescription ? '#94a3b8' : '#fff',
                      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                    <Sparkles size={14} />
                    {analyzing ? 'Analyzing…' : 'Verify with AI'}
                  </button>
                )}
                {image && missingDescription && (
                  <p style={{ fontSize: 11, color: '#f59e0b' }}>Add description first</p>
                )}
                {image && !missingDescription && !aiResult && (
                  <p style={{ fontSize: 11, color: '#6366f1' }}>Click to verify before submitting</p>
                )}
              </div>
            </div>

            {/* AI Result Card */}
            {aiResult && !aiResult.error && (
              <div style={{
                marginTop: 10, padding: '12px 14px', borderRadius: 10,
                background: isSuspicious ? '#fef2f2' : 'linear-gradient(135deg,#f0f4ff,#faf5ff)',
                border: `1.5px solid ${isSuspicious ? '#fecaca' : '#c7d2fe'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Sparkles size={14} color={isSuspicious ? '#ef4444' : '#6366f1'} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: isSuspicious ? '#dc2626' : '#4338ca' }}>
                    Gemini AI Analysis
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: aiResult.verificationStatus === 'Verified' ? '#dcfce7' : isSuspicious ? '#fef2f2' : '#fef9c3',
                    color: aiResult.verificationStatus === 'Verified' ? '#16a34a' : isSuspicious ? '#dc2626' : '#ca8a04'
                  }}>
                    {aiResult.verificationStatus === 'Verified' ? '✅' : isSuspicious ? '🚫' : '❓'} {aiResult.verificationStatus}
                  </span>
                </div>

                {isSuspicious && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                    <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, margin: 0 }}>
                      🚫 Submission blocked — image does not match the reported incident.
                      Please re-upload a relevant photo.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#e0e7ff', color: '#4338ca', fontWeight: 600 }}>
                    Match: {aiResult.matchConfidence}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                    background: SEVERITY_CONFIG[aiResult.severity]?.bg || '#f1f5f9',
                    color: SEVERITY_CONFIG[aiResult.severity]?.color || '#64748b'
                  }}>
                    🎯 AI Severity: {aiResult.severity}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px', fontStyle: 'italic' }}>{aiResult.severityReason}</p>
                {!isSuspicious && <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>💡 {aiResult.aiInsight}</p>}
              </div>
            )}
            {aiResult?.error && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>⚠️ {aiResult.error}</p>
            )}
          </div>

          {/* Severity badge */}
          <div className="inc-severity-row">
            <span className="inc-section-label" style={{ margin: 0 }}>Severity:</span>
            <span className="inc-severity-badge"
              style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
              {severity === 'Critical' ? '🔴' : severity === 'High' ? '🟠' : severity === 'Medium' ? '🟡' : '🟢'} {severity}
            </span>
            <span className="text-xs text-slate-400">{aiResult?.severity ? '✨ AI verified' : '(auto-detected)'}</span>
          </div>

          {/* Location */}
          <div>
            <p className="inc-section-label">Location</p>
            <div className="inc-loc-tabs">
              {[['search','🔍 Search'],['map','📍 Map Pin'],['gps','🎯 GPS']].map(([m, label]) => (
                <button key={m} onClick={() => setLocMode(m)}
                  className={`inc-loc-tab ${locMode === m ? 'active' : ''}`}>
                  {label}
                </button>
              ))}
            </div>

            {locMode === 'search' && (
              <div className="flex gap-2 mt-2">
                <input className="amb-input flex-1" placeholder="Search address or landmark…"
                  value={locSearch}
                  onChange={e => setLocSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && geocodeSearch()} />
                <button onClick={geocodeSearch} className="ad-geocode-btn">
                  {geocoding ? '…' : '🔍'}
                </button>
              </div>
            )}

            {locMode === 'map' && (
              <button onClick={onPickOnMap} className="inc-map-pick-btn">
                <MapPin size={14} /> Click to pin on map
              </button>
            )}

            {locMode === 'gps' && (
              <button onClick={useGPS} disabled={geocoding} className="inc-map-pick-btn gps">
                <Navigation size={14} /> {geocoding ? 'Getting location…' : 'Use my current location'}
              </button>
            )}

            {location && (
              <>
                <div className="inc-loc-set">
                  📍 {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                  <button onClick={() => setLocation(null)} className="text-red-400 text-xs ml-2">✕</button>
                </div>
                <div className="inc-finetune">
                  <div className="flex items-center gap-1 mb-1">
                    <Move size={11} className="text-indigo-400" />
                    <span className="text-xs text-slate-500 font-medium">Drag the pin to fine-tune exact location</span>
                  </div>
                  <div style={{ height: 180, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={{ lat: location.lat, lng: location.lng }}
                      zoom={18}
                      options={{ disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy' }}
                    >
                      <Marker
                        position={{ lat: location.lat, lng: location.lng }}
                        draggable
                        onDragEnd={handleMarkerDrag}
                      />
                    </GoogleMap>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                </div>
              </>
            )}
          </div>

          {/* Reporter name */}
          <div>
            <p className="inc-section-label">Your Name <span className="text-slate-400 font-normal">(optional)</span></p>
            <input className="amb-input" placeholder="Anonymous"
              value={reporterName} onChange={e => setReporterName(e.target.value)} />
          </div>

          {/* Block reason */}
          {submitBlockReason && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef9c3', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: 12, color: '#92400e', fontWeight: 600, margin: 0 }}>{submitBlockReason}</p>
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={!canSubmit}
            className="amb-submit-btn"
            style={{ background: canSubmit ? sev.color : '#94a3b8', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            {submitting ? 'Submitting…' : canSubmit ? `🚨 Submit ${severity} Incident` : '🔒 Complete all steps to submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportModal;
