import { useState, useCallback } from 'react';
import { X, MapPin, AlertTriangle, Navigation, Move } from 'lucide-react';
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
  Low:      { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Low' },
  Medium:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Medium' },
  High:     { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'High' },
  Critical: { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', label: 'Critical' },
};

// Client-side severity heuristic (mirrors backend logic for instant feedback)
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
  const [type,        setType]        = useState('Accident');
  const [description, setDescription] = useState('');
  const [locMode,     setLocMode]     = useState('search'); // 'search' | 'map' | 'gps'
  const [locSearch,   setLocSearch]   = useState('');
  const [location,    setLocation]    = useState(pickedLocation || null);
  const [geocoding,   setGeocoding]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [reporterName,setReporterName]= useState('');

  const handleMarkerDrag = useCallback((e) => {
    const lat = e.latLng.lat(), lng = e.latLng.lng();
    // eslint-disable-next-line no-undef
    new google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      const address = status === 'OK' && results[0] ? results[0].formatted_address : '';
      setLocation({ lat, lng, address });
    });
  }, []);

  const severity = autoSeverity(type, description);
  const sev = SEVERITY_CONFIG[severity];

  // Update location when map pick comes in via prop
  if (pickedLocation && (!location || (location.lat !== pickedLocation.lat || location.lng !== pickedLocation.lng))) {
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
    if (!location) return;
    setSubmitting(true);
    await onSubmit({ type, description, location, reportedBy: reporterName || 'Anonymous' });
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
              <p className="inc-modal-sub">Help others by reporting road issues</p>
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
                  onClick={() => setType(t.value)}
                  className={`inc-type-btn ${type === t.value ? 'active' : ''}`}>
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity badge (auto) */}
          <div className="inc-severity-row">
            <span className="inc-section-label" style={{ margin: 0 }}>Auto-detected Severity:</span>
            <span className="inc-severity-badge"
              style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
              {severity === 'Critical' ? '🔴' : severity === 'High' ? '🟠' : severity === 'Medium' ? '🟡' : '🟢'} {severity}
            </span>
            <span className="text-xs text-slate-400">(based on type + description)</span>
          </div>

          {/* Description */}
          <div>
            <p className="inc-section-label">Description <span className="text-slate-400 font-normal">(optional — improves severity)</span></p>
            <textarea className="amb-input" rows={2}
              placeholder="e.g. Major accident blocking 2 lanes, injuries reported…"
              value={description}
              onChange={e => setDescription(e.target.value)} />
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
              <button onClick={onPickOnMap}
                className="inc-map-pick-btn">
                <MapPin size={14} /> Click to pin on map
              </button>
            )}

            {locMode === 'gps' && (
              <button onClick={useGPS} disabled={geocoding}
                className="inc-map-pick-btn gps">
                <Navigation size={14} /> {geocoding ? 'Getting location…' : 'Use my current location'}
              </button>
            )}

            {location && (
              <>
                <div className="inc-loc-set">
                  📍 {location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                  <button onClick={() => setLocation(null)} className="text-red-400 text-xs ml-2">✕</button>
                </div>

                {/* Fine-tune map */}
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
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        gestureHandling: 'greedy',
                        mapTypeId: 'roadmap',
                      }}
                    >
                      <Marker
                        position={{ lat: location.lat, lng: location.lng }}
                        draggable
                        onDragEnd={handleMarkerDrag}
                      />
                    </GoogleMap>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
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

          <button onClick={handleSubmit}
            disabled={!location || submitting}
            className="amb-submit-btn"
            style={{ background: sev.color }}>
            {submitting ? 'Submitting…' : `🚨 Submit ${severity} Incident`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentReportModal;
