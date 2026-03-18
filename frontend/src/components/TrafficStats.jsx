const getSeverity = (type) => {
  if (type === 'Accident') return 'high';
  if (type === 'Heavy Traffic') return 'medium';
  return 'low';
};

const TrafficStats = ({ incidents }) => {
  const accidents = incidents?.filter(i => i.type === 'Accident').length || 0;
  const heavy = incidents?.filter(i => i.type === 'Heavy Traffic').length || 0;
  const blocks = incidents?.filter(i => i.type === 'Road Block').length || 0;
  const construction = incidents?.filter(i => i.type === 'Construction').length || 0;
  const total = incidents?.length || 0;

  const congestionScore = Math.min(100, accidents * 20 + heavy * 15 + blocks * 10 + construction * 5);
  const congestionColor = congestionScore > 60 ? '#ef4444' : congestionScore > 30 ? '#f59e0b' : '#22c55e';
  const congestionLabel = congestionScore > 60 ? 'High' : congestionScore > 30 ? 'Moderate' : 'Low';

  const stats = [
    { label: 'Total Incidents', value: total, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Accidents', value: accidents, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Heavy Traffic', value: heavy, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Road Blocks', value: blocks, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  ];

  return (
    <div className="mt-4 space-y-3">
      {/* Congestion Score */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">City Congestion Index</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: congestionColor, background: `${congestionColor}20` }}>
            {congestionLabel}
          </span>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold" style={{ color: congestionColor }}>{congestionScore}</span>
          <span className="text-slate-500 text-sm mb-1">/100</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${congestionScore}%`, background: congestionColor }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="stat-card rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Incidents List */}
      {incidents?.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Reports</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {incidents.slice(0, 6).map((inc, i) => (
              <div key={inc._id || i} className={`incident-badge glass-light rounded-lg px-3 py-2 flex items-center justify-between severity-${getSeverity(inc.type)}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{inc.type === 'Accident' ? '🚗' : inc.type === 'Road Block' ? '🚧' : inc.type === 'Construction' ? '🏗️' : '⚠️'}</span>
                  <span className="text-xs text-slate-300">{inc.type}</span>
                </div>
                <span className="text-xs text-slate-500">{inc.location?.lat?.toFixed(3)}, {inc.location?.lng?.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficStats;
