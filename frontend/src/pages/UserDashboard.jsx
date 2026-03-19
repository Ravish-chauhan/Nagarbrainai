import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Brain, AlertTriangle, CloudUpload, Activity, MapPin,
  RefreshCw, ChevronRight, Siren, BarChart3, Map, Phone, X, CheckCircle
} from 'lucide-react';

import { uploadToCloudinary } from '../utils/cloudinary';
import RoutePlanner        from '../components/RoutePlanner';
import TrafficStats        from '../components/TrafficStats';
import DetectionCanvas     from '../components/DetectionCanvas';
import IncidentReportModal from '../components/IncidentReportModal';

const API_URI = 'http://localhost:5000/api/traffic';
const AMB_URI = 'http://localhost:5000/api/ambulance';

const UserDashboard = () => {
  const navigate = useNavigate();

  const [incidents,          setIncidents]          = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isEmergency,        setIsEmergency]        = useState(false);
  const [activeTab,          setActiveTab]          = useState('route');
  const [isOnline,           setIsOnline]           = useState(true);
  const [lastUpdated,        setLastUpdated]        = useState(new Date());
  const [time,               setTime]               = useState(new Date());
  const [refreshing,         setRefreshing]         = useState(false);

  // Incident reporting
  const [showIncidentModal,  setShowIncidentModal]  = useState(false);
  const [incidentPickLoc,    setIncidentPickLoc]    = useState(null);  // from map click while modal open
  const [pickingIncidentLoc, setPickingIncidentLoc] = useState(false); // map-pin mode

  const [warningsPerRoute, setWarningsPerRoute] = useState([]);

  // Ambulance
  const [showAmbModal,  setShowAmbModal]  = useState(false);
  const [ambForm,       setAmbForm]       = useState({ userName: '', phone: '', description: '' });
  const [ambLocation,   setAmbLocation]   = useState(null);
  const [ambSubmitting, setAmbSubmitting] = useState(false);
  const [ambSuccess,    setAmbSuccess]    = useState(false);
  const [pickingAmbLoc, setPickingAmbLoc] = useState(false);

  // AI detect
  const [detecting,        setDetecting]        = useState(false);
  const [detectionResult,  setDetectionResult]  = useState(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [imageNaturalSize, setImageNaturalSize] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchIncidents = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_URI}/incidents`);
      setIncidents(res.data);
      setLastUpdated(new Date());
      setIsOnline(true);
    } catch { setIsOnline(false); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const t = setInterval(fetchIncidents, 30000);
    return () => clearInterval(t);
  }, [fetchIncidents]);

  const handleRouteSet = useCallback((start, dest) => {
    if (!start || !dest) { setDirectionsResponse(null); setWarningsPerRoute([]); return; }
    // eslint-disable-next-line no-undef
    new google.maps.DirectionsService().route({
      origin: start, destination: dest,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
    }, (result, status) => {
      if (status === 'OK') {
        setDirectionsResponse(result);
        setSelectedRouteIndex(0);
        setWarningsPerRoute([]);
      } else {
        console.warn('Directions failed:', status);
      }
    });
  }, []);

  const submitIncident = async ({ type, description, location, reportedBy, image, aiResult }) => {
    let imageUrl = '';
    try {
      if (image) imageUrl = await uploadToCloudinary(image);
    } catch (e) { console.warn('Cloudinary upload failed:', e.message); }
    const res = await axios.post(`${API_URI}/incidents`, { type, description, location, reportedBy, imageUrl, aiResult });
    setIncidents(prev => [res.data, ...prev]);
    setIncidentPickLoc(null);
  };

  // Map click handler — routes to correct consumer
  const handleMapClick = (latlng) => {
    if (pickingAmbLoc) {
      setAmbLocation(latlng);
      setPickingAmbLoc(false);
    } else if (pickingIncidentLoc) {
      setIncidentPickLoc(latlng);
      setPickingIncidentLoc(false);
      setShowIncidentModal(true);
    }
  };

  const handleWarningsPerRoute = useCallback((wpr) => {
    setWarningsPerRoute(wpr);
  }, []);

  // AI detect
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDetecting(true); setDetectionResult(null); setUploadedImageSrc(null); setImageNaturalSize(null);
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url; video.currentTime = 0.5;
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const b64 = canvas.toDataURL('image/jpeg', 0.92);
        setUploadedImageSrc(b64);
        setImageNaturalSize({ w: video.videoWidth, h: video.videoHeight });
        URL.revokeObjectURL(url);
        sendForDetection(b64);
      };
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result;
      const img = new Image();
      img.onload = () => setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = b64;
      setUploadedImageSrc(b64);
      sendForDetection(b64);
    };
    reader.readAsDataURL(file);
  };

  const sendForDetection = async (imageBase64) => {
    try {
      const res = await axios.post(`${API_URI}/detect-traffic`, { imageBase64 });
      setDetectionResult(res.data);
    } catch { setDetectionResult({ error: true }); }
    finally { setDetecting(false); }
  };

  const submitAmbulance = async () => {
    if (!ambLocation) return;
    setAmbSubmitting(true);
    try {
      await axios.post(AMB_URI, { ...ambForm, location: ambLocation });
      setAmbSuccess(true);
      setTimeout(() => {
        setAmbSuccess(false); setShowAmbModal(false);
        setAmbForm({ userName: '', phone: '', description: '' }); setAmbLocation(null);
      }, 2500);
    } catch (err) { console.error(err); }
    finally { setAmbSubmitting(false); }
  };

  const tabs = [
    { id: 'route', label: 'Route',     icon: Map      },
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'ai',    label: 'AI Detect', icon: Brain     },
  ];

  return (
    <div className="ud-root">

      {/* Header */}
      <header className="ud-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="ud-back-btn">←</button>
          <div className="ud-logo"><Brain size={16} color="#fff" /></div>
          <div>
            <h1 className="ud-title">NagarBrain · Citizen Dashboard</h1>
            <p className="ud-sub">Traffic Intelligence · Route Planning · Emergency</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className={`ud-status ${isOnline ? 'online' : 'offline'}`}>
            <span className="ud-dot" />{isOnline ? 'Live' : 'Offline'}
          </div>
          {incidents.filter(i => i.active !== false).length > 0 && (
            <div className="ud-incident-badge">
              <AlertTriangle size={12} /> {incidents.filter(i => i.active !== false).length} Incidents
            </div>
          )}
          <div className="ud-clock">
            <span className="ud-clock-time">{time.toLocaleTimeString()}</span>
            <span className="ud-clock-date">{time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
          <button onClick={() => setShowIncidentModal(true)} className="ud-report-btn">
            <AlertTriangle size={13} /> Report Incident
          </button>
          <button onClick={() => navigate('/signals')} className="ud-signals-btn">🚦 Signals</button>
          <button onClick={() => setShowAmbModal(true)} className="ud-amb-btn">
            <Siren size={13} /> Ambulance
          </button>
          <button onClick={fetchIncidents} className="ud-icon-btn" title="Refresh">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="ud-body">

        {/* Sidebar */}
        <aside className="ud-sidebar">
          <div className="ud-tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`ud-tab ${activeTab === tab.id ? 'active' : ''}`}>
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="ud-tab-content">

            {activeTab === 'route' && (
              <>
                <RoutePlanner
                  onRouteSet={handleRouteSet}
                  isEmergency={isEmergency}
                  setIsEmergency={setIsEmergency}
                  directionsResponse={directionsResponse}
                  selectedRouteIndex={selectedRouteIndex}
                  onSelectRoute={setSelectedRouteIndex}
                  warningsPerRoute={warningsPerRoute}
                />

                <div className="ud-card">
                  <p className="ud-card-title">Traffic Legend</p>
                  {[['#10b981','Free Flow'],['#f59e0b','Moderate'],['#ef4444','Congested'],['#22c55e','Bypass Route']].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                      <span className="text-xs font-medium text-slate-700">{l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'stats' && (
              <>
                <div className="ud-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={14} className="text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-700">Live Analytics</span>
                  </div>
                  <p className="text-xs text-slate-400">Updated: {lastUpdated.toLocaleTimeString()}</p>
                </div>
                <TrafficStats incidents={incidents} />
              </>
            )}

            {activeTab === 'ai' && (
              <>
                <div className="ud-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain size={14} className="text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-700">AI Traffic Detection</span>
                    <span className="ud-badge indigo ml-auto">DETR</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Detects accidents, vehicles & ambulances.</p>
                </div>

                <div className="ud-card space-y-3">
                  <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploadedImageSrc ? 'h-10 border-indigo-300' : 'h-28 border-slate-200 hover:border-indigo-300'}`}>
                    <CloudUpload size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{uploadedImageSrc ? 'Upload another' : 'Upload image or video'}</span>
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleImageUpload} />
                  </label>

                  {uploadedImageSrc && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detection View</span>
                        {detecting && <span className="text-xs text-indigo-500 animate-pulse">Analyzing…</span>}
                      </div>
                      <DetectionCanvas imageSrc={uploadedImageSrc} detections={detectionResult?.detections || {}} imageNaturalSize={imageNaturalSize} />
                    </div>
                  )}

                  {detectionResult && !detectionResult.error && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="ud-stat-mini"><span className="text-lg font-bold text-slate-800">{detectionResult.vehicleCount}</span><span className="text-xs text-slate-400">Vehicles</span></div>
                      <div className={`ud-stat-mini ${detectionResult.accidentDetected ? 'border-red-200 bg-red-50' : ''}`}>
                        <span className={`text-sm font-bold ${detectionResult.accidentDetected ? 'text-red-500' : 'text-green-500'}`}>{detectionResult.accidentDetected ? 'YES' : 'NO'}</span>
                        <span className="text-xs text-slate-400">Accident</span>
                      </div>
                      <div className={`ud-stat-mini ${detectionResult.ambulanceDetected ? 'border-orange-200 bg-orange-50' : ''}`}>
                        <span className={`text-sm font-bold ${detectionResult.ambulanceDetected ? 'text-orange-500' : 'text-slate-400'}`}>{detectionResult.ambulanceDetected ? 'YES' : 'NO'}</span>
                        <span className="text-xs text-slate-400">Ambulance</span>
                      </div>
                    </div>
                  )}
                  {detectionResult?.error && <p className="text-xs text-red-500">Detection failed. Check backend.</p>}
                </div>

                <div className="ud-card">
                  <p className="ud-card-title">AI Recommendations</p>
                  {[['🔀','Reroute via Ring Road to avoid NH-48 congestion'],['🚦','Signal timing optimized for peak hours (8–10 AM)'],['🚨','Emergency corridor active on Outer Ring Road']].map(([icon, tip], i) => (
                    <div key={i} className="flex items-start gap-2 mb-2 p-2 rounded-lg bg-slate-50">
                      <span className="text-sm">{icon}</span>
                      <p className="text-xs text-slate-600 flex-1">{tip}</p>
                      <ChevronRight size={12} className="text-slate-300 mt-0.5" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="ud-map-area">
          <TrafficMap
            incidents={incidents}
            directionsResponse={directionsResponse}
            selectedRouteIndex={selectedRouteIndex}
            isEmergency={isEmergency}
            onMapClick={handleMapClick}
            onIncidentClick={(inc) => console.log('Incident clicked:', inc)}
            onWarningsPerRoute={handleWarningsPerRoute}
          />

          {/* Map mode banners */}
          {pickingAmbLoc && (
            <div className="ud-map-banner">
              <MapPin size={14} /> Click map to pin your ambulance location
              <button onClick={() => setPickingAmbLoc(false)} className="ml-3 text-red-500 font-bold text-xs">✕ Cancel</button>
            </div>
          )}
          {pickingIncidentLoc && (
            <div className="ud-map-banner" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
              <AlertTriangle size={14} /> Click map to pin incident location
              <button onClick={() => { setPickingIncidentLoc(false); setShowIncidentModal(true); }} className="ml-3 text-slate-500 font-bold text-xs">✕ Cancel</button>
            </div>
          )}

          {ambLocation && !pickingAmbLoc && (
            <div className="ud-map-pin-info">
              📍 Ambulance location pinned
            </div>
          )}

          <div className="ud-map-hint">
            <MapPin size={12} className="text-indigo-400" /> Use "Report Incident" to mark road issues
          </div>
        </div>
      </div>

      {/* ── Incident Report Modal ── */}
      {showIncidentModal && (
        <IncidentReportModal
          onClose={() => { setShowIncidentModal(false); setIncidentPickLoc(null); }}
          onSubmit={submitIncident}
          onPickOnMap={() => { setShowIncidentModal(false); setPickingIncidentLoc(true); }}
          pickedLocation={incidentPickLoc}
        />
      )}

      {/* ── Ambulance Request Modal ── */}
      {showAmbModal && (
        <div className="amb-modal-overlay">
          <div className="amb-modal">
            <div className="amb-modal-header">
              <div className="flex items-center gap-2">
                <div className="amb-modal-icon"><Siren size={18} color="#fff" /></div>
                <div>
                  <h2 className="amb-modal-title">Request Ambulance</h2>
                  <p className="amb-modal-sub">Emergency medical assistance</p>
                </div>
              </div>
              <button onClick={() => setShowAmbModal(false)} className="amb-close"><X size={18} /></button>
            </div>

            {ambSuccess ? (
              <div className="amb-success">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-green-700">Request Sent!</p>
                <p className="text-sm text-slate-500 mt-1">Ambulance admin has been notified.</p>
              </div>
            ) : (
              <div className="amb-modal-body">
                <div className="amb-field">
                  <label className="amb-label">Your Name</label>
                  <input className="amb-input" placeholder="Enter your name" value={ambForm.userName}
                    onChange={e => setAmbForm(f => ({ ...f, userName: e.target.value }))} />
                </div>
                <div className="amb-field">
                  <label className="amb-label"><Phone size={12} /> Phone Number</label>
                  <input className="amb-input" placeholder="+91 XXXXX XXXXX" value={ambForm.phone}
                    onChange={e => setAmbForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="amb-field">
                  <label className="amb-label">Description (optional)</label>
                  <textarea className="amb-input" rows={2} placeholder="Describe the emergency…" value={ambForm.description}
                    onChange={e => setAmbForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="amb-field">
                  <label className="amb-label"><MapPin size={12} /> Your Location</label>
                  {ambLocation ? (
                    <div className="amb-loc-set">
                      <span>📍 {ambLocation.lat.toFixed(5)}, {ambLocation.lng.toFixed(5)}</span>
                      <button onClick={() => { setPickingAmbLoc(true); setShowAmbModal(false); }} className="text-xs text-indigo-500 underline">Change</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setPickingAmbLoc(true); setShowAmbModal(false); }} className="amb-loc-btn map">📍 Pin on Map</button>
                      <button onClick={() => navigator.geolocation.getCurrentPosition(pos =>
                        setAmbLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                      )} className="amb-loc-btn gps">🎯 Use GPS</button>
                    </div>
                  )}
                </div>
                <button onClick={submitAmbulance} disabled={!ambLocation || ambSubmitting} className="amb-submit-btn">
                  {ambSubmitting ? 'Sending…' : '🚑 Send Emergency Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
