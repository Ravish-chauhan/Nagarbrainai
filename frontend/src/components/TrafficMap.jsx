import { useCallback, useEffect, useRef } from 'react';
import { GoogleMap, TrafficLayer, Marker } from '@react-google-maps/api';
import IncidentMarker from './IncidentMarker';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter    = { lat: 28.6139, lng: 77.2090 };

const ROUTE_COLORS    = ['#4f8ef7', '#f59e0b', '#22c55e', '#a855f7'];
const EMERGENCY_COLOR = '#ef4444';

const getStepTrafficColor = (step) => {
  const normal      = step.duration?.value || 1;
  const withTraffic = step.duration_in_traffic?.value;
  if (!withTraffic) return null;
  const ratio = withTraffic / normal;
  if (ratio >= 1.5) return '#ef4444';
  if (ratio >= 1.2) return '#f59e0b';
  return '#22c55e';
};

const toLatLngArr = (arr) => (arr || []).map(p => ({ lat: p.lat(), lng: p.lng() }));

const distMetres = (a, b) => {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 +
    Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

// Check if an incident lies on a route by testing against every point
// in every step's detailed path. 80m radius — tight enough to exclude
// parallel roads and nearby areas that are not on the actual route.
const incidentOnRoute = (inc, route) => {
  const loc = { lat: inc.location.lat, lng: inc.location.lng };
  for (const step of route.legs[0].steps) {
    const pts = toLatLngArr(step.path || []);
    for (const pt of pts) {
      if (distMetres(loc, pt) <= 25) return true;
    }
  }
  return false;
};

const TrafficMap = ({
  incidents = [],
  directionsResponse,
  onMapClick,
  newIncidentLoc,
  isEmergency,
  selectedRouteIndex = 0,
  onIncidentClick,
  onWarningsPerRoute,  // callback(warningsPerRoute: Array<incident[]>) — one array per route
}) => {
  const mapRef       = useRef(null);
  const renderersRef = useRef([]);
  const polylinesRef = useRef([]);
  const markersRef   = useRef([]);

  const prevResponseRef  = useRef(null);
  const prevEmergencyRef = useRef(null);
  const prevSelectedRef  = useRef(null);
  const prevIncidentsRef = useRef(null);

  const onLoad    = useCallback((map) => { mapRef.current = map; syncRenderers(); }, []); // eslint-disable-line
  const onUnmount = useCallback(() => {
    [...renderersRef.current, ...polylinesRef.current, ...markersRef.current].forEach(o => o.setMap(null));
    renderersRef.current = []; polylinesRef.current = []; markersRef.current = [];
    mapRef.current = null;
  }, []);

  const syncRenderers = useCallback(() => {
    if (!mapRef.current) return;
    if (
      prevResponseRef.current  === directionsResponse &&
      prevEmergencyRef.current === isEmergency &&
      prevSelectedRef.current  === selectedRouteIndex &&
      prevIncidentsRef.current === incidents
    ) return;

    prevResponseRef.current  = directionsResponse;
    prevEmergencyRef.current = isEmergency;
    prevSelectedRef.current  = selectedRouteIndex;
    prevIncidentsRef.current = incidents;

    renderersRef.current.forEach(r => r.setMap(null));
    polylinesRef.current.forEach(p => p.setMap(null));
    markersRef.current.forEach(m => m.setMap(null));
    renderersRef.current = []; polylinesRef.current = []; markersRef.current = [];

    if (!directionsResponse) return;

    const map         = mapRef.current;
    const totalRoutes = directionsResponse.routes.length;
    const activeIncs  = incidents.filter(inc => inc.active !== false);

    // Compute per-route warnings using precise step paths
    const warningsPerRoute = directionsResponse.routes.map(route =>
      activeIncs.filter(inc => incidentOnRoute(inc, route))
    );

    if (onWarningsPerRoute) onWarningsPerRoute(warningsPerRoute);

    directionsResponse.routes.forEach((route, i) => {
      const isSelected = i === selectedRouteIndex;
      const leg        = route.legs[0];
      const steps      = leg.steps || [];

      if (!isSelected) {
        // eslint-disable-next-line no-undef
        const renderer = new google.maps.DirectionsRenderer({
          map, directions: directionsResponse, routeIndex: i,
          suppressMarkers: true, suppressInfoWindows: true, preserveViewport: true,
          polylineOptions: { strokeColor: '#475569', strokeWeight: 3, strokeOpacity: 0.35, zIndex: totalRoutes - i },
        });
        renderersRef.current.push(renderer);
        return;
      }

      // Selected route — draw step-by-step with traffic colours
      let hasTraffic = false;
      steps.forEach((step) => {
        const trafficColor = getStepTrafficColor(step);
        if (trafficColor) hasTraffic = true;
        const path  = toLatLngArr(step.path);
        const color = isEmergency ? EMERGENCY_COLOR : (trafficColor || ROUTE_COLORS[i % ROUTE_COLORS.length]);
        // eslint-disable-next-line no-undef
        polylinesRef.current.push(new google.maps.Polyline({
          map, path, strokeColor: '#000', strokeWeight: 9, strokeOpacity: 0.2, zIndex: totalRoutes + 9,
        }));
        // eslint-disable-next-line no-undef
        polylinesRef.current.push(new google.maps.Polyline({
          map, path, strokeColor: color, strokeWeight: 6, strokeOpacity: 1, zIndex: totalRoutes + 10,
        }));
      });

      if (!hasTraffic) {
        const fullPath = toLatLngArr(route.overview_path);
        const color    = isEmergency ? EMERGENCY_COLOR : ROUTE_COLORS[i % ROUTE_COLORS.length];
        // eslint-disable-next-line no-undef
        polylinesRef.current.push(new google.maps.Polyline({
          map, path: fullPath, strokeColor: '#000', strokeWeight: 9, strokeOpacity: 0.2, zIndex: totalRoutes + 9,
        }));
        // eslint-disable-next-line no-undef
        polylinesRef.current.push(new google.maps.Polyline({
          map, path: fullPath, strokeColor: color, strokeWeight: 6, strokeOpacity: 1, zIndex: totalRoutes + 10,
        }));
      }

      // Start marker
      // eslint-disable-next-line no-undef
      markersRef.current.push(new google.maps.Marker({
        map,
        position: { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
        // eslint-disable-next-line no-undef
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        zIndex: totalRoutes + 20,
      }));

      // End marker
      // eslint-disable-next-line no-undef
      markersRef.current.push(new google.maps.Marker({
        map,
        position: { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z" fill="#ef4444"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`
          ),
          // eslint-disable-next-line no-undef
          anchor: new google.maps.Point(14, 36),
        },
        zIndex: totalRoutes + 20,
      }));
    });
  }, [directionsResponse, isEmergency, selectedRouteIndex, incidents]); // eslint-disable-line

  useEffect(() => { syncRenderers(); }, [syncRenderers]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      mapContainerClassName="traffic-map-container"
      center={defaultCenter}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={ev => onMapClick && onMapClick({ lat: ev.latLng.lat(), lng: ev.latLng.lng() })}
      options={{
        zoomControl: true, streetViewControl: true,
        mapTypeControl: true, fullscreenControl: true,
        mapTypeControlOptions: { position: 3 },
        fullscreenControlOptions: { position: 7 },
        zoomControlOptions: { position: 7 },
        gestureHandling: 'greedy',
      }}
    >
      <TrafficLayer />

      {incidents.filter(i => i.active !== false).map((incident, i) => (
        <IncidentMarker key={incident._id || i} incident={incident} onClick={onIncidentClick} />
      ))}

      {newIncidentLoc && (
        <Marker position={newIncidentLoc}
          icon={{
            url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="#6366f1" opacity="0.25"/><circle cx="18" cy="18" r="8" fill="#6366f1"/><circle cx="18" cy="18" r="3" fill="white"/></svg>`
            )
          }}
        />
      )}
    </GoogleMap>
  );
};

export default TrafficMap;
