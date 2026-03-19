import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain, Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle, Filter, Eye } from 'lucide-react';

const API_URI = 'http://localhost:5000/api/traffic';

const SEVERITY_COLOR = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444', Critical: '#7c3aed' };
const SEVERITY_BG    = { Low: '#f0fdf4', Medium: '#fffbeb', High: '#fef2f2', Critical: '#faf5ff' };

const TYPE_EMOJI = {
  'Accident': '🚗', 'Road Block': '🚧', 'Construction': '🏗️',
  'Heavy Traffic': '⚠️', 'Bridge Damage': '🌉', 'Flooding': '🌊',
  'Fire': '🔥', 'Fallen Tree': '🌳', 'Other': '📍',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const IncidentAdminPanel = () => {
  const navigate = useNavigate();
  const [incidents,   setIncidents]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [filterSev,   setFilterSev]   = useState('All');
  const [filterType,  setFilterType]  = useState('All');
  const [filterActive,setFilterActive]= useState('active');
  const [preview,     setPreview]     = useState(null); // incident for detail modal
  const [deleting,    setDeleting]    = useState(null);

  const fetchIncidents = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_URI}/incidents`);
      setIncidents(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this incident from the map?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_URI}/incidents/${id}`);
      setIncidents(prev => prev.filter(i => i._id !== id));
      if (preview?._id === id) setPreview(null);
    } catch (e) { alert('Delete failed: ' + e.message); }
    finally { setDeleting(null); }
  };

  const handleResolve = async (id) => {
    try {
      await axios.patch(`${API_URI}/incidents/${id}/resolve`);
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, active: false } : i));
    } catch (e) { alert('Failed: ' + e.message); }
  };

  const filtered = incidents.filter(i => {
    if (filterSev !== 'All' && i.severity !== filterSev) return false;
    if (filterType !== 'All' && i.type !== filterType) return false;
    if (filterActive === 'active' && i.active === false) return false;
    if (filterActive === 'resolved' && i.active !== false) return false;
    return true;
  });

  const stats = {
    total:    incidents.length,
    active:   incidents.filter(i => i.active !== false).length,
    critical: incidents.filter(i => i.severity === 'Critical' && i.active !== false).length,
    verified: incidents.filter(i => i.verified).length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'system-ui,sans-serif', color: '#e2e8f0' }}>

      {/* Header */}
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Incident Admin Panel</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Manage & remove map incidents</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/user')} style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={14} /> User Map
          </button>
          <button onClick={fetchIncidents} style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      <div style={{ padding: '20px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total', value: stats.total, color: '#6366f1', icon: '📋' },
            { label: 'Active', value: stats.active, color: '#f59e0b', icon: '🔴' },
            { label: 'Critical', value: stats.critical, color: '#ef4444', icon: '🚨' },
            { label: 'AI Verified', value: stats.verified, color: '#22c55e', icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1e293b', borderRadius: 12, padding: '16px 18px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: '14px 16px', border: '1px solid #334155', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={14} color="#64748b" />
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
            style={{ background: '#334155', border: 'none', color: '#e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="resolved">Resolved Only</option>
          </select>
          <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
            style={{ background: '#334155', border: 'none', color: '#e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}>
            <option value="All">All Severities</option>
            {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: '#334155', border: 'none', color: '#e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}>
            <option value="All">All Types</option>
            {['Accident','Road Block','Construction','Heavy Traffic','Bridge Damage','Flooding','Fire','Fallen Tree','Other'].map(t => <option key={t}>{t}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>{filtered.length} incidents</span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading incidents…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>No incidents found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(inc => (
              <div key={inc._id} style={{
                background: '#1e293b', borderRadius: 12, border: `1px solid ${inc.active === false ? '#334155' : SEVERITY_COLOR[inc.severity] + '44'}`,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                opacity: inc.active === false ? 0.6 : 1,
              }}>
                {/* Image thumbnail */}
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {inc.imageUrl
                    ? <img src={inc.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24 }}>{TYPE_EMOJI[inc.type] || '📍'}</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{TYPE_EMOJI[inc.type]} {inc.type}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: SEVERITY_BG[inc.severity], color: SEVERITY_COLOR[inc.severity] }}>
                      {inc.severity}
                    </span>
                    {inc.verified && <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>✅ Verified</span>}
                    {inc.active === false && <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>Resolved</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>👤 {inc.reportedBy}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>🕐 {timeAgo(inc.createdAt)}</span>
                    {inc.location?.address && <span style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>📍 {inc.location.address}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setPreview(inc)}
                    style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <Eye size={13} /> View
                  </button>
                  {inc.active !== false && (
                    <button onClick={() => handleResolve(inc._id)}
                      style={{ background: '#1e3a2f', border: '1px solid #22c55e44', color: '#22c55e', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                      <CheckCircle size={13} /> Resolve
                    </button>
                  )}
                  <button onClick={() => handleDelete(inc._id)} disabled={deleting === inc._id}
                    style={{ background: '#3b1f1f', border: '1px solid #ef444444', color: '#ef4444', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <Trash2 size={13} /> {deleting === inc._id ? '…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setPreview(null)}>
          <div style={{ background: '#1e293b', borderRadius: 16, width: '100%', maxWidth: 480, border: `2px solid ${SEVERITY_COLOR[preview.severity]}`, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: SEVERITY_COLOR[preview.severity], padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{TYPE_EMOJI[preview.type]}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 15 }}>{preview.type}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{preview.severity} · {timeAgo(preview.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setPreview(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {preview.imageUrl && (
              <img src={preview.imageUrl} alt="incident" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
            )}

            <div style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{preview.description || 'No description provided'}</p>

              {preview.aiResult && !preview.aiResult.error && (
                <div style={{ background: '#0f172a', borderRadius: 10, padding: '12px', marginBottom: 12, border: '1px solid #334155' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#818cf8' }}>✨ Gemini AI Analysis</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#1e3a5f', color: '#60a5fa', fontWeight: 600 }}>Match: {preview.aiResult.matchConfidence}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: SEVERITY_BG[preview.aiResult.severity], color: SEVERITY_COLOR[preview.aiResult.severity], fontWeight: 600 }}>Severity: {preview.aiResult.severity}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: preview.aiResult.verificationStatus === 'Verified' ? '#14532d' : '#7f1d1d', color: preview.aiResult.verificationStatus === 'Verified' ? '#4ade80' : '#f87171', fontWeight: 600 }}>{preview.aiResult.verificationStatus}</span>
                  </div>
                  {preview.aiResult.severityReason && <p style={{ margin: '0 0 4px', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{preview.aiResult.severityReason}</p>}
                  {preview.aiResult.aiInsight && <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>💡 {preview.aiResult.aiInsight}</p>}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                <span>👤 {preview.reportedBy}</span>
                {preview.location?.address && <span>📍 {preview.location.address}</span>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {preview.active !== false && (
                  <button onClick={() => { handleResolve(preview._id); setPreview(null); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #22c55e44', background: '#1e3a2f', color: '#22c55e', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircle size={14} /> Mark Resolved
                  </button>
                )}
                <button onClick={() => handleDelete(preview._id)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #ef444444', background: '#3b1f1f', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Trash2 size={14} /> Remove from Map
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentAdminPanel;
