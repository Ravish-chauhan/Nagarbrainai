import { useState } from 'react';
import { Navigation, X, Zap, Route, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';

const ROUTE_COLORS = ['#4f8ef7', '#f59e0b', '#22c55e', '#a855f7'];

const SEVERITY_CONFIG = {
  Low:      { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '🟢', delay: 2  },
  Medium:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🟡', delay: 8  },
  High:     { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '🟠', delay: 20 },
  Critical: { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', icon: '🔴', delay: 45 },
};

const TYPE_EMOJI = {
  'Accident': '🚗', 'Road Block': '🚧', 'Construction': '🏗️',
  'Heavy Traffic': '⚠️', 'Bridge Damage': '🌉', 'Flooding': '🌊',
  'Fire': '🔥', 'Fallen Tree': '🌳', 'Other': '📍',
};

const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') || '';

const distMetres = (a, b) => {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 +
    Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

const getDurationSecs = (route) =>
  route.legs[0].duration_in_traffic?.value ?? route.legs[0].duration.value;

const getDurationText = (leg) =>
  leg.duration_in_traffic?.text ?? leg.duration.text;

const getRoadTag = (step) => {
  const text = (step.instructions + ' ' + (step.transit?.line?.name || '')).toLowerCase();
  if (text.includes('highway') || text.includes('nh-') || text.includes('expressway')) return { label: 'Highway', color: '#22c55e' };
  if (text.includes('flyover') || text.includes('elevated')) return { label: 'Flyover', color: '#6366f1' };
  if (text.includes('toll'))   return { label: 'Toll',   color: '#f59e0b' };
  if (text.includes('u-turn')) return { label: 'U-Turn', color: '#ef4444' };
  return null;
};

const severityRank = { Low: 0, Medium: 1, High: 2, Critical: 3 };

const worstSeverity = (warnings) =>
  warnings.length
    ? warnings.reduce((w, inc) =>
        (severityRank[inc.severity] ?? 0) > (severityRank[w.severity] ?? 0) ? inc : w
      , warnings[0])
    : null;

const RoutePlanner = ({
  onRouteSet, isEmergency, setIsEmergency,
  directionsResponse, onSelectRoute, selectedRouteIndex,
  warningsPerRoute = [],   // Array<incident[]> — one per route, from TrafficMap
}) => {
  const [start,       setStart]       = useState('');
  const [destination, setDestination] = useState('');
  const [expanded,    setExpanded]    = useState(null);

  const calculateRoute = (e) => {
    e.preventDefault();
    if (start && destination) { setExpanded(null); onRouteSet(start, destination); }
  };

  const clearRoute = () => {
    setStart(''); setDestination(''); setExpanded(null); onRouteSet(null, null);
  };

  const routes     = directionsResponse?.routes || [];
  const fastestIdx = routes.length
    ? routes.reduce((b, r, i) => getDurationSecs(r) < getDurationSecs(routes[b]) ? i : b, 0)
    : 0;

  // Find the best clean alternate to suggest when selected route has High/Critical
  const selectedWarnings = warningsPerRoute[selectedRouteIndex] || [];
  const selectedHasSevere = selectedWarnings.some(w => w.severity === 'High' || w.severity === 'Critical');
  const suggestedAltIdx = selectedHasSevere
    ? routes.findIndex((_, i) => i !== selectedRouteIndex && !(warningsPerRoute[i] || []).some(w => w.severity === 'High' || w.severity === 'Critical'))
    : -1;

  return (
    <div className="rp-card">

      {/* Header */}
      <div className="rp-header">
        <div className="flex items-center gap-2">
          <div className="rp-icon"><Route size={14} color="#6366f1" /></div>
          <span className="rp-title">Route Planner</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Emergency</span>
          <button onClick={() => setIsEmergency(!isEmergency)} className={`rp-toggle ${isEmergency ? 'on' : ''}`}>
            <span className="rp-toggle-knob" />
          </button>
        </div>
      </div>

      {isEmergency && (
        <div className="rp-emergency-banner">
          <Zap size={12} /> Emergency mode — fastest path priority
        </div>
      )}

      {/* Form */}
      <form onSubmit={calculateRoute} className="rp-form">
        <div className="rp-input-wrap">
          <span className="rp-dot green" />
          <input className="rp-input" value={start} onChange={e => setStart(e.target.value)}
            placeholder="Start location…" required />
        </div>
        <div className="rp-connector" />
        <div className="rp-input-wrap">
          <span className="rp-dot red" />
          <input className="rp-input" value={destination} onChange={e => setDestination(e.target.value)}
            placeholder="Destination…" required />
        </div>
        <div className="flex gap-2 mt-2">
          <button type="submit" className={`rp-go-btn ${isEmergency ? 'emergency' : ''}`}>
            <Navigation size={13} /> {isEmergency ? 'Emergency Route' : 'Find Route'}
          </button>
          {(start || destination || directionsResponse) && (
            <button type="button" onClick={clearRoute} className="rp-clear-btn"><X size={13} /></button>
          )}
        </div>
      </form>

      {/* Route list */}
      {routes.length > 0 && (
        <div className="rp-routes">
          <p className="rp-routes-label">{routes.length} route{routes.length > 1 ? 's' : ''} found</p>

          {/* Suggest alternate banner */}
          {suggestedAltIdx !== -1 && (
            <div className="rp-alt-suggest">
              <span className="text-xs font-bold text-amber-700">⚠️ Incident on selected route</span>
              <button
                className="rp-alt-suggest-btn"
                onClick={() => { onSelectRoute(suggestedAltIdx); setExpanded(null); }}
              >
                Switch to Route {suggestedAltIdx + 1} →
              </button>
            </div>
          )}

          {routes.map((route, i) => {
            const leg          = route.legs[0];
            const isSelected   = selectedRouteIndex === i;
            const isExp        = expanded === i;
            const isFastest    = i === fastestIdx;
            const color        = isEmergency ? '#ef4444' : ROUTE_COLORS[i % ROUTE_COLORS.length];
            const durationSecs = getDurationSecs(route);
            const fastestSecs  = getDurationSecs(routes[fastestIdx]);
            const extraMins    = Math.round((durationSecs - fastestSecs) / 60);

            const routeWarnings = warningsPerRoute[i] || [];
            const worst         = worstSeverity(routeWarnings);
            const totalDelay    = routeWarnings.reduce((s, inc) => s + (SEVERITY_CONFIG[inc.severity]?.delay ?? 0), 0);
            const hasSevere     = routeWarnings.some(w => w.severity === 'High' || w.severity === 'Critical');

            return (
              <div key={i} className={`rp-route-card ${isSelected ? 'selected' : ''}`}
                style={{ borderLeftColor: color }}>

                {/* Route summary row */}
                <button className="rp-route-btn" onClick={() => {
                  setExpanded(isExp ? null : i);
                  onSelectRoute(i);
                }}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="rp-route-dot" style={{ background: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-700">
                          {isFastest ? (isEmergency ? '🚨 Emergency' : '⚡ Fastest') : `Route ${i + 1}`}
                        </span>
                        {isFastest && <span className="rp-best-badge">Best</span>}
                        {!isFastest && extraMins > 0 && (
                          <span className="text-xs text-slate-400">+{extraMins} min</span>
                        )}
                        {routeWarnings.length > 0 && (
                          <span className="rp-warn-badge" style={{ background: hasSevere ? '#fef2f2' : '#fffbeb', color: hasSevere ? '#dc2626' : '#d97706' }}>
                            ⚠️ {routeWarnings.length} incident{routeWarnings.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {routeWarnings.length === 0 && <span className="rp-clear-badge">✓ Clear</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-bold" style={{ color }}>{getDurationText(leg)}</span>
                        <span className="text-xs text-slate-400">{leg.distance.text}</span>
                        {route.summary && <span className="text-xs text-slate-400 truncate">via {route.summary}</span>}
                      </div>
                    </div>
                  </div>
                  {isExp ? <ChevronUp size={13} className="text-slate-400 flex-shrink-0" />
                         : <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />}
                </button>

                {/* Incident summary (only when selected and has warnings) */}
                {isSelected && routeWarnings.length > 0 && (
                  <div className="rp-incident-block">
                    <div className="rp-delay-banner"
                      style={{ background: SEVERITY_CONFIG[worst.severity]?.bg, borderColor: SEVERITY_CONFIG[worst.severity]?.border }}>
                      <Clock size={12} style={{ color: SEVERITY_CONFIG[worst.severity]?.color }} />
                      <span style={{ color: SEVERITY_CONFIG[worst.severity]?.color }} className="font-bold text-xs">
                        +{totalDelay} min estimated delay
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        · ETA ~{(() => {
                          const m = Math.round((getDurationSecs(route) + totalDelay * 60) / 60);
                          return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m} min`;
                        })()}
                      </span>
                    </div>

                    {routeWarnings.map((inc, wi) => {
                      const sev = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.Medium;
                      return (
                        <div key={wi} className="rp-incident-row"
                          style={{ borderLeftColor: sev.color, background: sev.bg }}>
                          <span className="text-base flex-shrink-0">{TYPE_EMOJI[inc.type] || '⚠️'}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold" style={{ color: sev.color }}>
                              {sev.icon} {inc.severity} — {inc.type}
                            </span>
                            {inc.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{inc.description}</p>}
                            {inc.location?.address && (
                              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <MapPin size={9} /> {inc.location.address.split(',').slice(0,2).join(',')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Expanded turn-by-turn */}
                {isExp && (
                  <div className="rp-steps" style={{ borderTopColor: `${color}30` }}>
                    <p className="rp-steps-label">Turn-by-Turn</p>

                    <div className="flex items-start gap-2 mb-1">
                      <div className="flex flex-col items-center mt-0.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 block" />
                        <span className="w-px flex-1 bg-slate-200 my-0.5 block" style={{ minHeight: 10 }} />
                      </div>
                      <p className="text-xs text-slate-600">{leg.start_address?.split(',').slice(0,2).join(',')}</p>
                    </div>

                    {leg.steps?.map((step, si) => {
                      const instr = stripHtml(step.instructions);
                      const tag   = getRoadTag(step);
                      const last  = si === leg.steps.length - 1;

                      // Match incident to this step: check every path point at 80m
                      const stepPts = (step.path || []).map(p => ({ lat: p.lat(), lng: p.lng() }));
                      const stepIncs = routeWarnings.filter(inc => {
                        const loc = { lat: inc.location.lat, lng: inc.location.lng };
                        return stepPts.some(pt => distMetres(loc, pt) <= 25);
                      });

                      return (
                        <div key={si}>
                          <div className="flex items-start gap-2 mb-1">
                            <div className="flex flex-col items-center mt-0.5 flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 block" />
                              {(!last || stepIncs.length > 0) && <span className="w-px bg-slate-200 my-0.5 block" style={{ minHeight: 10 }} />}
                            </div>
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-start gap-1.5 flex-wrap">
                                <p className="text-xs text-slate-600 leading-relaxed">{instr}</p>
                                {tag && (
                                  <span className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                                    style={{ background: `${tag.color}18`, color: tag.color }}>
                                    {tag.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{step.distance?.text} · {step.duration?.text}</p>
                            </div>
                          </div>

                          {/* Inline incident at this step */}
                          {stepIncs.map((inc, ii) => {
                            const sev = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.Medium;
                            return (
                              <div key={ii} className="flex items-start gap-2 mb-2 ml-5 rounded-lg px-2 py-1.5"
                                style={{ background: sev.bg, borderLeft: `3px solid ${sev.color}` }}>
                                <span className="text-sm flex-shrink-0">{TYPE_EMOJI[inc.type] || '⚠️'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold" style={{ color: sev.color }}>
                                    {sev.icon} {inc.severity} — {inc.type}
                                  </p>
                                  {inc.description && <p className="text-xs text-slate-500 truncate">{inc.description}</p>}
                                  <p className="text-xs text-slate-400 mt-0.5">⚠️ Incident on this segment</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    <div className="flex items-start gap-2">
                      <MapPin size={10} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600">{leg.end_address?.split(',').slice(0,2).join(',')}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoutePlanner;
