import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, TrafficLayer, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Siren, MapPin, Clock, CheckCircle, XCircle,
  RefreshCw, ArrowLeft, Navigation, Plus, Trash2, Hospital,
} from 'lucide-react';

import IncidentMarker from '../components/IncidentMarker';

const AMB_URI     = 'http://localhost:5000/api/ambulance';
const STATION_URI = 'http://localhost:5000/api/stations';

const STATUS_COLOR = { pending: '#f59e0b', dispatched: '#3b82f6', completed: '#10b981', cancelled: '#94a3b8' };
const STATUS_BG    = { pending: '#fffbeb', dispatched: '#eff6ff', completed: '#f0fdf4', cancelled: '#f8fafc' };
const ROUTE_COLORS = ['#ef4444', '#6366f1', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

const haversineKm = (a, b) => {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

const AmbulanceDashboard = () => {

  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const polysRef   = useRef([]);

  const [tab,          setTab]          = useState('requests');
  const [requests,     setRequests]     = useState([]);
  const [stations,     setStations]     = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [routes,       setRoutes]       = useState([]);
  const [refreshing,   setRefreshing]   = useState(false);
  const [time,         setTime]         = useState(new Date());

  // Station add form
  const [addingStation,  setAddingStation]  = useState(false);   // waiting for map click
  const [stationForm,    setStationForm]    = useState({ name: '', address: '' });
  const [pendingLatLng,  setPendingLatLng]  = useState(null);    // clicked but not saved yet
  const [geocoding,      setGeocoding]      = useState(false);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const fetchRequests = useCallback(async () => {
    setRefreshing(true);
    try { const r = await axios.get(AMB_URI); setRequests(r.data); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  const fetchStations = useCallback(async () => {
    try { const r = await axios.get(STATION_URI); setStations(r.data); }
    catch (e) { console.error(e); }
  }, []);

  const [incidents, setIncidents] = useState([]);
  const fetchIncidents = useCallback(async () => {
    try { const r = await axios.get('http://localhost:5000/api/traffic/incidents'); setIncidents(r.data); }
    catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchStations();
    fetchIncidents();
    const t = setInterval(() => {
      fetchRequests();
      fetchIncidents();
    }, 10000);
    return () => clearInterval(t);
  }, [fetchRequests, fetchStations, fetchIncidents]);

  // ── Station management ──────────────────────────────────────────────────
  const handleMapClick = (ev) => {
    const lat = ev.latLng.lat(), lng = ev.latLng.lng();
    if (addingStation) {
      setPendingLatLng({ lat, lng });
      // Reverse geocode to fill address
      setGeocoding(true);
      // eslint-disable-next-line no-undef
      const gc = new google.maps.Geocoder();
      gc.geocode({ location: { lat, lng } }, (results, status) => {
        setGeocoding(false);
        if (status === 'OK' && results[0]) {
          setStationForm(f => ({ ...f, address: results[0].formatted_address }));
        }
      });
    }
  };

  const geocodeAddress = () => {
    if (!stationForm.address) return;
    setGeocoding(true);
    // eslint-disable-next-line no-undef
    const gc = new google.maps.Geocoder();
    gc.geocode({ address: stationForm.address }, (results, status) => {
      setGeocoding(false);
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        setPendingLatLng({ lat: loc.lat(), lng: loc.lng() });
        mapRef.current?.panTo({ lat: loc.lat(), lng: loc.lng() });
        mapRef.current?.setZoom(15);
      }
    });
  };

  const saveStation = async () => {
    if (!stationForm.name || !pendingLatLng) return;
    try {
      const res = await axios.post(STATION_URI, {
        name:    stationForm.name,
        address: stationForm.address,
        lat:     pendingLatLng.lat,
        lng:     pendingLatLng.lng,
      });
      setStations(prev => [...prev, res.data]);
      setStationForm({ name: '', address: '' });
      setPendingLatLng(null);
      setAddingStation(false);
    } catch (e) { console.error(e); }
  };

  const deleteStation = async (id) => {
    try {
      await axios.delete(`${STATION_URI}/${id}`);
      setStations(prev => prev.filter(s => s._id !== id));
    } catch (e) { console.error(e); }
  };

  // ── Route computation ───────────────────────────────────────────────────
  const clearPolylines = () => {
    polysRef.current.forEach(p => p.setMap(null));
    polysRef.current = [];
    setRoutes([]);
  };

  // Helper for computing incident intersections and delays
  const distMetres = (a, b) => {
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  };
  const incidentOnRoute = (inc, route) => {
    const loc = { lat: inc.location.lat, lng: inc.location.lng };
    for (const step of route.legs[0].steps) {
      const pts = (step.path || []).map(p => ({ lat: p.lat(), lng: p.lng() }));
      for (const pt of pts) if (distMetres(loc, pt) <= 25) return true;
    }
    return false;
  };
  const SEVERITY_DELAY = { Low: 2, Medium: 8, High: 20, Critical: 45 };

  const computeRoutes = useCallback((req) => {
    if (!mapRef.current || !req || stations.length === 0) return;
    clearPolylines();

    const dest = req.location;

    // Build routes using DirectionsService so we get the accurate path to compare with incidents
    const svc = new google.maps.DirectionsService();
    const mapSnap = mapRef.current;
    
    // Determine if we are computing multiple options for ONE assigned station, OR best options from ALL active stations
    const targetStations = req.assignedStation 
      ? stations.filter(s => s.name === req.assignedStation)
      : stations;

    if (targetStations.length === 0) return;

    // Create an array of promises for route computation
    const routePromises = targetStations.map((station, idx) => {
      return new Promise((resolve) => {
        svc.route({
          origin:      { lat: station.lat, lng: station.lng },
          destination: { lat: dest.lat,    lng: dest.lng    },
          // eslint-disable-next-line no-undef
          travelMode:  google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true, // ALWAYS fetch alternative routes per user request
          drivingOptions: {
            departureTime: new Date(),
            // eslint-disable-next-line no-undef
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
        }, (dirResult, dirStatus) => {
          if (dirStatus !== 'OK') {
            resolve([]);
            return;
          }
          
          // Map all returned routes (will be 1 if provideRouteAlternatives is false, or multiple if true)
          const gRoutes = dirResult.routes.map((gRoute, rIdx) => {
            const leg = gRoute.legs[0];
            const baseSecs = leg.duration_in_traffic?.value ?? leg.duration.value;
            const baseText = leg.duration_in_traffic?.text ?? leg.duration.text;
            
            // Check incidents on this route
            const activeIncs = incidents.filter(inc => inc.active !== false);
            const warnings = activeIncs.filter(inc => incidentOnRoute(inc, gRoute));
            
            // Add delay penalty
            const penaltyMins = warnings.reduce((sum, inc) => sum + (SEVERITY_DELAY[inc.severity] || 8), 0);
            const totalSecs = baseSecs + (penaltyMins * 60);
            
            return {
              stationId:    rIdx === 0 ? station._id : `${station._id}-alt-${rIdx}`,
              stationName:  rIdx === 0 ? station.name : `${station.name} (Alt Route ${rIdx})`,
              distKm:       (leg.distance.value / 1000).toFixed(1),
              durationText: penaltyMins > 0 ? `${Math.round(totalSecs/60)} mins (inc. delay)` : baseText,
              durationSecs: totalSecs,
              warnings,
              color:        ROUTE_COLORS[(idx + rIdx) % ROUTE_COLORS.length],
              station,
              gRoute,
              isAlternative: rIdx > 0
            };
          });

          resolve(gRoutes);
        });
      });
    });

    Promise.all(routePromises).then((resultsGroups) => {
      // Flatten the results and filter out failures, then sort by fastest total time
      const validRoutes = resultsGroups.flat().sort((a, b) => a.durationSecs - b.durationSecs);
      
      if(validRoutes.length > 0) validRoutes[0].isFastest = true;
      
      // KEEP gRoute so we can redraw it later when selecting a route from the list
      setRoutes(validRoutes);

      // We'll defer the drawing to a dedicated function so it can be re-called when a select occurs
      drawSelectedRoutes(validRoutes, null);
      
      mapSnap.panTo({ lat: dest.lat, lng: dest.lng });
      mapSnap.setZoom(14);
    });
  }, [stations, incidents]);

  // Handle active selected route from list
  const [activeRouteId, setActiveRouteId] = useState(null);

  const drawSelectedRoutes = useCallback((routesToDraw, focusId) => {
    polysRef.current.forEach(p => p.setMap(null));
    polysRef.current = [];

    routesToDraw.forEach((r, idx) => {
      const isFastest = r.isFastest;
      const isFocused = focusId ? r.stationId === focusId : true;
      const notFocused = focusId && r.stationId !== focusId;

      const path = r.gRoute.overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));

      // shadow
      // eslint-disable-next-line no-undef
      polysRef.current.push(new google.maps.Polyline({
        map: mapRef.current, path,
        strokeColor: '#000', strokeWeight: 9, strokeOpacity: notFocused ? 0.05 : 0.12, zIndex: 4,
      }));

      // route line
      // eslint-disable-next-line no-undef
      polysRef.current.push(new google.maps.Polyline({
        map: mapRef.current, path,
        strokeColor:   r.color,
        strokeWeight:  r.isAlternative ? 4 : (isFastest ? 7 : 5),
        strokeOpacity: notFocused ? 0.15 : (r.isAlternative ? 0.5 : (isFastest ? 1 : 0.8)),
        zIndex:        notFocused ? 1 : (r.isAlternative ? 2 : (isFastest ? 10 : 8)),
      }));
    });
  }, []);

  // Whenever active route changes, redraw
  useEffect(() => {
    if (routes.length > 0) {
      drawSelectedRoutes(routes, activeRouteId);
    }
  }, [activeRouteId, routes, drawSelectedRoutes]);

  const handleSelectRequest = (req) => {
    setSelected(req);
    setActiveRouteId(null);
    computeRoutes(req);
  };

  const updateStatus = async (id, status, stationName) => {
    try {
      const res = await axios.patch(`${AMB_URI}/${id}/status`, { status, assignedStation: stationName });
      setRequests(prev => prev.map(r => r._id === id ? res.data : r));
      if (selected?._id === id) {
        setSelected(res.data);
        // computeRoutes runs automatically based on no deps but since it modifies based on selected we should call it again
        computeRoutes(res.data)
      }
    } catch (e) { console.error(e); }
  };

  const pending    = requests.filter(r => r.status === 'pending');
  const dispatched = requests.filter(r => r.status === 'dispatched');
  const done       = requests.filter(r => ['completed', 'cancelled'].includes(r.status));

  return (
    <div className="ad-root">

      {/* Header */}
      <header className="ad-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="ud-back-btn"><ArrowLeft size={15} /></button>
          <div className="ad-logo"><Siren size={16} color="#fff" /></div>
          <div>
            <h1 className="ad-title">Ambulance Control Center</h1>
            <p className="ad-sub">Emergency Dispatch · Route Optimization</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="ad-counts">
            <span className="ad-count pending">{pending.length} Pending</span>
            <span className="ad-count dispatched">{dispatched.length} Dispatched</span>
            <span className="ad-count station">{stations.length} Stations</span>
          </div>
          <span className="ad-clock">{time.toLocaleTimeString()}</span>
          <button onClick={() => { fetchRequests(); fetchStations(); }} className="ud-icon-btn">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="ad-body">

        {/* Left panel */}
        <aside className="ad-sidebar">

          {/* Tab switcher */}
          <div className="ad-panel-tabs">
            <button className={`ad-panel-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
              <Siren size={12} /> Requests
              {pending.length > 0 && <span className="ad-tab-badge">{pending.length}</span>}
            </button>
            <button className={`ad-panel-tab ${tab === 'stations' ? 'active' : ''}`} onClick={() => setTab('stations')}>
              <Hospital size={12} /> Stations
            </button>
          </div>

          {/* ── Requests tab ── */}
          {tab === 'requests' && (
            <div className="ad-request-list">
              {requests.length === 0 && (
                <div className="ad-empty">
                  <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No requests yet</p>
                </div>
              )}
              {pending.length > 0    && <p className="ad-section-label">🔴 Pending ({pending.length})</p>}
              {pending.map(r    => <RequestCard key={r._id} req={r} selected={selected} onSelect={handleSelectRequest} onStatus={updateStatus} />)}
              {dispatched.length > 0 && <p className="ad-section-label">🔵 Dispatched ({dispatched.length})</p>}
              {dispatched.map(r => <RequestCard key={r._id} req={r} selected={selected} onSelect={handleSelectRequest} onStatus={updateStatus} />)}
              {done.length > 0       && <p className="ad-section-label">✅ Done</p>}
              {done.map(r       => <RequestCard key={r._id} req={r} selected={selected} onSelect={handleSelectRequest} onStatus={updateStatus} />)}
            </div>
          )}

          {/* ── Stations tab ── */}
          {tab === 'stations' && (
            <div className="ad-station-panel">

              {/* Add station form */}
              <div className="ad-station-form">
                <p className="ad-station-form-title">
                  <Plus size={12} /> Add Ambulance Station
                </p>
                <input className="amb-input" placeholder="Station name (e.g. AIIMS Station)"
                  value={stationForm.name}
                  onChange={e => setStationForm(f => ({ ...f, name: e.target.value }))} />

                <div className="flex gap-2 mt-2">
                  <input className="amb-input flex-1" placeholder="Address or search…"
                    value={stationForm.address}
                    onChange={e => setStationForm(f => ({ ...f, address: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && geocodeAddress()} />
                  <button onClick={geocodeAddress} className="ad-geocode-btn" title="Search address">
                    {geocoding ? '…' : '🔍'}
                  </button>
                </div>

                <div className={`ad-map-click-hint ${addingStation ? 'active' : ''}`}
                  onClick={() => setAddingStation(v => !v)}>
                  <MapPin size={12} />
                  {addingStation ? 'Click on the map to pin location' : 'Or click to pin on map'}
                </div>

                {pendingLatLng && (
                  <div className="ad-pending-loc">
                    📍 {pendingLatLng.lat.toFixed(5)}, {pendingLatLng.lng.toFixed(5)}
                  </div>
                )}

                <button
                  onClick={saveStation}
                  disabled={!stationForm.name || !pendingLatLng}
                  className="ad-save-station-btn"
                >
                  <Plus size={13} /> Save Station
                </button>
              </div>

              {/* Station list */}
              <div className="ad-station-list">
                {stations.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No stations added yet</p>
                )}
                {stations.map((s, i) => (
                  <div key={s._id} className="ad-station-item">
                    <div className="ad-station-dot" style={{ background: ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.address || `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`}</p>
                    </div>
                    <button onClick={() => deleteStation(s._id)} className="ad-del-btn" title="Remove">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right — map + route panel */}
        <div className="ad-main">
          <div className="ad-map-wrap">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%', minHeight: '300px' }}
              defaultCenter={{ lat: 28.6139, lng: 77.2090 }}
              defaultZoom={11}
              onLoad={map => { mapRef.current = map; }}
              onUnmount={() => { clearPolylines(); mapRef.current = null; }}
              onClick={handleMapClick}
              options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, gestureHandling: 'greedy' }}
            >
              <TrafficLayer />

              {/* Station markers */}
              {stations.map((s, i) => (
                <Marker key={s._id}
                  position={{ lat: s.lat, lng: s.lng }}
                  title={s.name}
                  icon={{
                    url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="${ROUTE_COLORS[i % ROUTE_COLORS.length]}" stroke="#fff" stroke-width="2.5"/>
                        <text x="18" y="23" text-anchor="middle" font-size="15" fill="white">🏥</text>
                      </svg>`),
                    // eslint-disable-next-line no-undef
                    anchor: new google.maps.Point(18, 18),
                  }}
                />
              ))}

              {/* Pending pin while adding station */}
              {pendingLatLng && (
                <Marker position={pendingLatLng}
                  icon={{
                    url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="14" fill="#6366f1" stroke="#fff" stroke-width="2" stroke-dasharray="4 2"/>
                        <text x="16" y="21" text-anchor="middle" font-size="14" fill="white">📍</text>
                      </svg>`),
                    // eslint-disable-next-line no-undef
                    anchor: new google.maps.Point(16, 16),
                  }}
                />
              )}

              {/* Patient marker */}
              {selected && (
                <Marker position={{ lat: selected.location.lat, lng: selected.location.lng }}
                  title={`Patient: ${selected.userName}`}
                  icon={{
                    url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
                        <path d="M19 0C8.51 0 0 8.51 0 19c0 13.1 19 27 19 27S38 32.1 38 19C38 8.51 29.49 0 19 0z" fill="#ef4444"/>
                        <circle cx="19" cy="19" r="10" fill="white"/>
                        <text x="19" y="24" text-anchor="middle" font-size="13" fill="#ef4444">🚨</text>
                      </svg>`),
                    // eslint-disable-next-line no-undef
                    anchor: new google.maps.Point(19, 46),
                  }}
                />
              )}

              {/* Incidents marking */}
              {incidents.filter(i => i.active !== false).map((incident, i) => (
                <IncidentMarker key={incident._id || i} incident={incident} />
              ))}
            </GoogleMap>

            {/* Map overlay hints */}
            {addingStation && (
              <div className="ad-map-banner blue">
                <MapPin size={13} /> Click anywhere on the map to place the station
                <button onClick={() => setAddingStation(false)} className="ml-3 text-red-500 font-bold text-xs">✕ Cancel</button>
              </div>
            )}

            {!selected && !addingStation && stations.length === 0 && (
              <div className="ad-map-hint">
                <Hospital size={14} /> Add stations first, then select a request to see routes
              </div>
            )}

            {!selected && !addingStation && stations.length > 0 && (
              <div className="ad-map-hint">
                <Siren size={14} /> Select a request to compute routes from all stations
              </div>
            )}
          </div>

          {/* Route panel */}
          {selected && (
            <div className="ad-route-panel">
              <div className="ad-route-header">
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    🚨 {selected.userName || 'Anonymous'}
                    {selected.phone ? ` · ${selected.phone}` : ''}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selected.description || 'No description'} · 📍 {selected.location.lat.toFixed(4)}, {selected.location.lng.toFixed(4)}
                  </p>
                  {selected.assignedStation && (
                    <p className="text-xs text-blue-500 mt-0.5">🚑 Assigned: {selected.assignedStation}</p>
                  )}
                </div>
                <span className="ad-status-badge" style={{ background: STATUS_BG[selected.status], color: STATUS_COLOR[selected.status] }}>
                  {selected.status.toUpperCase()}
                </span>
              </div>

              {stations.length === 0 && (
                <p className="text-xs text-amber-500 py-2">⚠️ No stations added yet. Go to the Stations tab to add ambulance locations.</p>
              )}

              <div className="ad-routes-list">
                {stations.length > 0 && routes.length === 0 && (
                  <p className="text-xs text-slate-400 py-2 flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                    Computing routes from {stations.length} station{stations.length > 1 ? 's' : ''}…
                  </p>
                )}
                {routes.map((r) => (
                  <div key={r.stationId} 
                    onClick={() => setActiveRouteId(r.stationId === activeRouteId ? null : r.stationId)}
                    className={`ad-route-item ${r.isFastest ? 'nearest' : ''} ${selected.assignedStation && selected.assignedStation !== r.stationName ? 'opacity-50' : ''} cursor-pointer hover:bg-slate-100 ${activeRouteId === r.stationId ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}
                    style={{ borderLeftColor: r.color }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="ad-route-dot" style={{ background: r.color }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{r.stationName}</p>
                        <p className="text-xs text-slate-400">{r.distKm} km · {r.durationText}</p>
                        {r.warnings && r.warnings.length > 0 && (
                          <div className="mt-1">
                            {r.warnings.map((w, wi) => (
                               <p key={wi} className="text-[10px] text-red-500 font-semibold truncate">
                                 ⚠️ {w.severity} {w.type} incident on route
                               </p>
                            ))}
                          </div>
                        )}
                      </div>
                      {r.isFastest && <span className="ad-nearest-badge">Fastest</span>}
                    </div>
                    {selected.status === 'pending' && (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(selected._id, 'dispatched', r.stationName); }}
                        className="ad-dispatch-btn" style={{ background: r.color }}>
                        <Navigation size={11} /> Dispatch
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                {selected.status === 'dispatched' && (
                  <button onClick={() => updateStatus(selected._id, 'completed')} className="ad-action-btn green">
                    <CheckCircle size={13} /> Completed
                  </button>
                )}
                {!['cancelled','completed'].includes(selected.status) && (
                  <button onClick={() => updateStatus(selected._id, 'cancelled')} className="ad-action-btn red">
                    <XCircle size={13} /> Cancel
                  </button>
                )}
                <button onClick={() => { setSelected(null); clearPolylines(); }} className="ad-action-btn grey">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestCard = ({ req, selected, onSelect, onStatus }) => {
  const isSelected = selected?._id === req._id;
  const age = Math.round((Date.now() - new Date(req.createdAt)) / 60000);
  return (
    <div onClick={() => onSelect(req)}
      className={`ad-req-card ${isSelected ? 'selected' : ''}`}
      style={{ borderLeftColor: STATUS_COLOR[req.status] }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-700 truncate">{req.userName || 'Anonymous'}</p>
          <p className="text-xs text-slate-400 truncate">{req.phone || 'No phone'}</p>
          {req.description && <p className="text-xs text-slate-500 truncate mt-0.5">{req.description}</p>}
          {req.assignedStation && <p className="text-xs text-blue-500 mt-0.5">🚑 {req.assignedStation}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="ad-status-badge sm" style={{ background: STATUS_BG[req.status], color: STATUS_COLOR[req.status] }}>
            {req.status}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={9} /> {age < 1 ? 'just now' : `${age}m ago`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceDashboard;
