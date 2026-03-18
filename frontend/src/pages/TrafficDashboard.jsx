import { useState, useEffect, useCallback, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Brain, AlertTriangle, CloudUpload, Activity, MapPin,
  Wifi, WifiOff, RefreshCw, ChevronRight, Siren, BarChart3, Map
} from 'lucide-react';

import TrafficMap from '../components/TrafficMap';
import RoutePlanner from '../components/RoutePlanner';
import TrafficStats from '../components/TrafficStats';
import DetectionCanvas from '../components/DetectionCanvas';

const API_URI = 'http://localhost:5000/api/traffic';

const TrafficDashboard = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry']
  });

  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isEmergency, setIsEmergency] = useState(false);
  const [newIncidentLoc, setNewIncidentLoc] = useState(null);
  const [newIncidentType, setNewIncidentType] = useState('Accident');
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [imageNaturalSize, setImageNaturalSize] = useState(null);
  const videoRef = useRef(null);
  const [activeTab, setActiveTab] = useState('route');
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Live clock
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
    } catch {
      setIsOnline(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const handleRouteSet = useCallback((start, dest) => {
    if (!start || !dest) { setDirectionsResponse(null); return; }
    // eslint-disable-next-line no-undef
    const svc = new google.maps.DirectionsService();
    svc.route({
      origin: start,
      destination: dest,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
      drivingOptions: {
        departureTime: new Date(),
        // eslint-disable-next-line no-undef
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    }, (result, status) => {
      if (status === 'OK') {
        const fastest = result.routes.reduce((bestIdx, route, i) => {
          const getSecs = r => r.legs[0].duration_in_traffic?.value ?? r.legs[0].duration.value;
          return getSecs(route) < getSecs(result.routes[bestIdx]) ? i : bestIdx;
        }, 0);
        setDirectionsResponse(result);
        setSelectedRouteIndex(fastest);
      } else console.error('Directions error:', status);
    });
  }, [isEmergency]);

  const submitIncident = async () => {
    if (!newIncidentLoc) return;
    try {
      const res = await axios.post(`${API_URI}/incidents`, { type: newIncidentType, location: newIncidentLoc });
      setIncidents(prev => [res.data, ...prev]);
      setNewIncidentLoc(null);
    } catch (err) {
      console.error('Failed to add incident', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDetecting(true);
    setDetectionResult(null);
    setUploadedImageSrc(null);
    setImageNaturalSize(null);

    // If video — extract first frame as image
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.currentTime = 0.5;
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.92);
        setUploadedImageSrc(frameBase64);
        setImageNaturalSize({ w: video.videoWidth, h: video.videoHeight });
        URL.revokeObjectURL(url);
        sendForDetection(frameBase64);
      };
      return;
    }

    // Image file
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      // Get natural dimensions
      const img = new Image();
      img.onload = () => setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = base64;
      setUploadedImageSrc(base64);
      sendForDetection(base64);
    };
    reader.readAsDataURL(file);
  };

  const sendForDetection = async (imageBase64) => {
    try {
      const res = await axios.post(`${API_URI}/detect-traffic`, { imageBase64 });
      setDetectionResult(res.data);
    } catch {
      setDetectionResult({ error: true });
    } finally {
      setDetecting(false);
    }
  };

  if (loadError) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="text-red-400 text-5xl mb-4">⚠️</div>
        <p className="text-slate-300 font-semibold">Failed to load Google Maps</p>
        <p className="text-slate-500 text-sm mt-1">Check your API key in .env</p>
      </div>
    </div>
  );

  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300 font-semibold">Initializing NagarBrain</p>
        <p className="text-slate-500 text-sm mt-1">Loading map intelligence...</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'route', label: 'Route', icon: Map },
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
    { id: 'ai', label: 'AI Detect', icon: Brain },
  ];

  return (
    <div className="h-screen w-full flex flex-col" style={{ background: '#080d1a' }}>

      {/* Top Navbar */}
      <header className="glass border-b border-slate-800/60 px-5 py-3 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">NagarBrain</h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5">AI Traffic Intelligence</p>
          </div>
          <div className="ml-2 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
            <span className="text-xs text-indigo-400 font-medium">HACKATHON</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Status */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full pulse-dot ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-400">{isOnline ? 'Live' : 'Offline'}</span>
          </div>

          {/* Incident Count Badge */}
          {incidents.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-semibold text-red-400">{incidents.length} Active</span>
            </div>
          )}

          {/* Clock */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-mono font-bold text-slate-200">{time.toLocaleTimeString()}</p>
            <p className="text-xs text-slate-500">{time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          </div>

          {/* Signal Control Button */}
          <button
            onClick={() => navigate('/signals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}
          >
            🚦 Signal Control
          </button>

          {/* Refresh */}
          <button onClick={fetchIncidents} className="map-overlay-btn p-2 rounded-lg" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-[360px] flex-shrink-0 flex flex-col border-r border-slate-800/60 overflow-hidden" style={{ background: 'rgba(8,13,26,0.95)' }}>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800/60 px-4 pt-3 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-btn flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'text-indigo-400 bg-indigo-500/10 border-b-2 border-indigo-500'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Route Tab */}
            {activeTab === 'route' && (
              <>
                <RoutePlanner
                  onRouteSet={handleRouteSet}
                  isEmergency={isEmergency}
                  setIsEmergency={setIsEmergency}
                  directionsResponse={directionsResponse}
                  selectedRouteIndex={selectedRouteIndex}
                  onSelectRoute={setSelectedRouteIndex}
                />

                {/* Map Legend */}
                <div className="glass rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Traffic Legend</p>
                  <div className="space-y-2">
                    {[
                      { color: '#22c55e', label: 'Free Flow', desc: '< 20 vehicles/min' },
                      { color: '#f59e0b', label: 'Moderate', desc: '20–50 vehicles/min' },
                      { color: '#ef4444', label: 'Congested', desc: '> 50 vehicles/min' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-8 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <div>
                          <span className="text-xs font-medium text-slate-300">{item.label}</span>
                          <span className="text-xs text-slate-500 ml-2">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Incident Types */}
                <div className="glass rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Incident Types</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { emoji: '🚗', label: 'Accident', color: 'text-red-400' },
                      { emoji: '🚧', label: 'Road Block', color: 'text-orange-400' },
                      { emoji: '🏗️', label: 'Construction', color: 'text-yellow-400' },
                      { emoji: '⚠️', label: 'Heavy Traffic', color: 'text-amber-400' },
                    ].map(item => (
                      <div key={item.label} className="glass-light rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="text-sm">{item.emoji}</span>
                        <span className={`text-xs font-medium ${item.color}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">Live Analytics</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
                <TrafficStats incidents={incidents} />
              </>
            )}

            {/* AI Detection Tab */}
            {activeTab === 'ai' && (
              <>
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">AI Traffic Detection</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">DETR</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Detects accidents, vehicles & ambulances using <span className="text-indigo-400">gopesh353/traffic-accident-detection-detr</span> model.</p>
                </div>

                <div className="glass rounded-xl p-4 space-y-3">

                  {/* Upload button */}
                  <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl cursor-pointer transition-all group ${
                    uploadedImageSrc
                      ? 'h-10 border-indigo-500/40 hover:border-indigo-400'
                      : 'h-32 border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                  }`}>
                    <CloudUpload className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">
                      {uploadedImageSrc ? 'Upload another image / video' : 'Click to upload image or video'}
                    </span>
                    {!uploadedImageSrc && <p className="text-xs text-slate-600 block w-full text-center mt-1">PNG · JPG · MP4 · MOV</p>}
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleImageUpload} />
                  </label>

                  {/* Canvas preview with bounding boxes */}
                  {uploadedImageSrc && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detection View</span>
                        {detecting && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-indigo-400">Analyzing...</span>
                          </div>
                        )}
                      </div>
                      <DetectionCanvas
                        imageSrc={uploadedImageSrc}
                        detections={detectionResult?.detections || {}}
                        imageNaturalSize={imageNaturalSize}
                      />
                      {/* Legend */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {[['#4f8ef7','Vehicle'],['#ef4444','Accident'],['#f97316','Ambulance']].map(([color, label]) => (
                          <div key={label} className="flex items-center gap-1">
                            <div className="w-3 h-2 rounded-sm border" style={{ borderColor: color, background: `${color}25` }} />
                            <span className="text-xs text-slate-400">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {detectionResult && !detectionResult.error && (
                    <div className="space-y-2">

                      {/* Alerts */}
                      {detectionResult.alerts?.map((alert, i) => (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border ${
                          alert.severity === 'critical'  ? 'bg-red-500/15 border-red-500/40' :
                          alert.severity === 'emergency' ? 'bg-orange-500/15 border-orange-500/40' :
                          'bg-yellow-500/15 border-yellow-500/40'
                        }`}>
                          <span className="text-base flex-shrink-0">
                            {alert.type === 'accident' ? '🚨' : alert.type === 'ambulance' ? '🚑' : '⚠️'}
                          </span>
                          <p className={`text-xs font-semibold ${
                            alert.severity === 'critical'  ? 'text-red-300' :
                            alert.severity === 'emergency' ? 'text-orange-300' : 'text-yellow-300'
                          }`}>{alert.message}</p>
                        </div>
                      ))}

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="glass-light rounded-lg p-2.5 text-center">
                          <p className="text-xl font-bold text-white">{detectionResult.vehicleCount}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Vehicles</p>
                        </div>
                        <div className={`glass-light rounded-lg p-2.5 text-center ${detectionResult.accidentDetected ? 'border border-red-500/40' : ''}`}>
                          <p className={`text-xl font-bold ${detectionResult.accidentDetected ? 'text-red-400' : 'text-green-400'}`}>
                            {detectionResult.accidentDetected ? 'YES' : 'NO'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Accident</p>
                        </div>
                        <div className={`glass-light rounded-lg p-2.5 text-center ${detectionResult.ambulanceDetected ? 'border border-orange-500/40' : ''}`}>
                          <p className={`text-xl font-bold ${detectionResult.ambulanceDetected ? 'text-orange-400' : 'text-slate-400'}`}>
                            {detectionResult.ambulanceDetected ? 'YES' : 'NO'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Ambulance</p>
                        </div>
                      </div>

                      {/* Congestion */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                        detectionResult.congestionLevel === 'High'   ? 'bg-red-500/10 border-red-500/30' :
                        detectionResult.congestionLevel === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-green-500/10 border-green-500/30'
                      }`}>
                        <span className="text-xs text-slate-400">Congestion Level</span>
                        <span className={`text-sm font-bold ${
                          detectionResult.congestionLevel === 'High'   ? 'text-red-400' :
                          detectionResult.congestionLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                        }`}>{detectionResult.congestionLevel}</span>
                      </div>

                      {detectionResult.mocked && (
                        <p className="text-xs text-slate-500">⚡ Mock data — HF_API_TOKEN not set</p>
                      )}
                    </div>
                  )}

                  {detectionResult?.error && (
                    <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-400">Detection failed. Check backend connection.</p>
                    </div>
                  )}
                </div>

                {/* AI Recommendations */}
                <div className="glass rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Recommendations</p>
                  <div className="space-y-2">
                    {[
                      { icon: '🔀', tip: 'Reroute via Ring Road to avoid NH-48 congestion' },
                      { icon: '🚦', tip: 'Signal timing optimized for peak hours (8–10 AM)' },
                      { icon: '🚨', tip: 'Emergency corridor active on Outer Ring Road' },
                    ].map((item, i) => (
                      <div key={i} className="glass-light rounded-lg px-3 py-2.5 flex items-start gap-2">
                        <span className="text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.tip}</p>
                        <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative overflow-hidden">
          <TrafficMap
            incidents={incidents}
            directionsResponse={directionsResponse}
            selectedRouteIndex={selectedRouteIndex}
            isEmergency={isEmergency}
            onMapClick={setNewIncidentLoc}
            newIncidentLoc={newIncidentLoc}
          />

          {/* Map Top-Right Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            {isEmergency && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl glow-red" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}>
                <Siren className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-400">EMERGENCY MODE</span>
              </div>
            )}
            <div className="map-overlay-btn px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300">Click map to report</span>
            </div>
          </div>

          {/* Bottom-Left: Live Incident Count */}
          <div className="absolute bottom-6 left-4 z-10">
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400 pulse-dot" />
                <span className="text-xs text-slate-400">Incidents</span>
              </div>
              <span className="text-lg font-bold text-white">{incidents.length}</span>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-xs text-slate-400">Traffic Layer ON</span>
              </div>
            </div>
          </div>

          {/* Report Incident Modal */}
          {newIncidentLoc && (
            <div className="absolute bottom-6 right-4 z-10 w-72">
              <div className="glass rounded-xl p-4 glow-blue">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-slate-200">Report Incident</span>
                </div>
                <p className="text-xs text-slate-500 mb-3 font-mono">
                  📍 {newIncidentLoc.lat.toFixed(5)}, {newIncidentLoc.lng.toFixed(5)}
                </p>
                <select
                  value={newIncidentType}
                  onChange={e => setNewIncidentType(e.target.value)}
                  className="w-full mb-3 px-3 py-2 rounded-lg text-sm"
                >
                  <option value="Accident">🚗 Accident</option>
                  <option value="Road Block">🚧 Road Block</option>
                  <option value="Construction">🏗️ Construction</option>
                  <option value="Heavy Traffic">⚠️ Heavy Traffic</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={submitIncident}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setNewIncidentLoc(null)}
                    className="flex-1 py-2 rounded-lg glass-light hover:bg-slate-700 text-slate-300 text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrafficDashboard;
