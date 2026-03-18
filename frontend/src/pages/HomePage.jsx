import { useNavigate } from 'react-router-dom';

const features = [
  { title: 'Traffic Intelligence', desc: 'AI-driven congestion detection, emergency vehicle prioritization, and peak-hour prediction.', color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff', icon: <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="7" y="2" width="10" height="20" rx="3" stroke="#4a5568" fill="#1f2937"/><circle cx="12" cy="7" r="2.5" fill="#ef4444"/><circle cx="12" cy="12" r="2.5" fill="#eab308"/><circle cx="12" cy="17" r="2.5" fill="#22c55e"/></svg> },
  { title: 'Waste Management', desc: 'Citizen reporting with AI image verification. Automated route optimization for collection teams.', color: '#059669', bg: '#ecfdf5', border: '#d1fae5', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> },
  { title: 'Infrastructure Monitoring', desc: 'Real-time pipeline pressure tracking, anomaly detection, and predictive maintenance scheduling.', color: '#0284c7', bg: '#f0f9ff', border: '#e0f2fe', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg> },
  { title: 'Energy Demand Prediction', desc: 'Smart grid monitoring, overload alerts, and 24-hour demand forecasting for the power network.', color: '#d97706', bg: '#fffbeb', border: '#fef3c7', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Navbar ── */}
      <nav style={{ width: '100%', height: 80, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'fixed', top: 0, left: 0, zIndex: 50, borderBottom: '1px solid #e8efe8', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1b5e20,#2e7d32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0d2818', letterSpacing: '-0.3px' }}>NagarBrain AI</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['Home', 'Features', 'Analytics', 'Contact'].map(item => (
            <button key={item} style={{ padding: '8px 16px', border: 'none', background: 'transparent', color: '#1a1a1a', fontSize: 16, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}>{item}</button>
          ))}
        </div>

        <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 28px', borderRadius: 28, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1b5e20,#2e7d32)', color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(27,94,32,0.3)' }}>
          View Dashboard
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{ marginTop: 80, minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', padding: '40px 40px 80px', background: 'linear-gradient(160deg,#f5f7f5 0%,#e8f5e9 30%,#f5f7f5 60%,#e0f2f1 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.08, color: '#0a1a0a', marginBottom: 24, letterSpacing: '-1.5px' }}>
              Empower Your City<br />With Smarter{' '}
              <span style={{ background: 'linear-gradient(135deg,#2e7d32,#00c853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Urban Solutions</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.7, color: '#4a5a4a', maxWidth: 560, marginBottom: 40 }}>
              Streamline municipal operations, manage resources efficiently, and make data-driven decisions with our cutting-edge AI platform.
            </p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/dashboard')} style={{ padding: '16px 36px', borderRadius: 32, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#1b5e20,#2e7d32)', color: '#fff', fontSize: 17, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(27,94,32,0.3)' }}>
                View Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </button>
              <button style={{ padding: '16px 36px', borderRadius: 32, border: '2px solid #1b5e20', cursor: 'pointer', background: 'transparent', color: '#1b5e20', fontSize: 17, fontWeight: 600 }}>
                Watch Demo
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/brainimage.png" alt="Smart City" style={{ width: '100%', maxWidth: 600, height: 'auto' }} />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 40px', background: 'linear-gradient(180deg,#e0f2f1 0%,#fcfdfc 15%,#fcfdfc 100%)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f4f0', cursor: 'pointer', transition: 'transform 0.2s,box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'; }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, border: `1px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{f.icon}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: '#111827', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6b7280', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0a1a0a', color: '#e8efe8', padding: '60px 40px 28px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#2e7d32,#66bb6a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>NagarBrain AI</span>
            </div>
            <p style={{ color: '#9aa99a', fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>Building smarter, safer, and more sustainable cities through cutting-edge AI orchestration.</p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Solutions</h4>
            {['Traffic Intelligence', 'Waste Management', 'Infrastructure Monitoring', 'Energy Grid AI', 'Emergency Response'].map(item => (
              <div key={item} style={{ color: '#9aa99a', fontSize: 14, marginBottom: 10, cursor: 'pointer' }}>{item}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Company</h4>
            {['About Us', 'Careers', 'Partnerships', 'News & Blog', 'Contact Us'].map(item => (
              <div key={item} style={{ color: '#9aa99a', fontSize: 14, marginBottom: 10, cursor: 'pointer' }}>{item}</div>
            ))}
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Stay Updated</h4>
            <p style={{ color: '#9aa99a', fontSize: 13, marginBottom: 14 }}>Subscribe for the latest smart city insights.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a2a', background: '#162816', color: '#fff', fontSize: 13, outline: 'none' }} />
              <button style={{ padding: '0 18px', borderRadius: 8, border: 'none', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Subscribe</button>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1280, margin: '0 auto', borderTop: '1px solid #2a3a2a', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: '#7a8a7a', fontSize: 13, margin: 0 }}>© {new Date().getFullYear()} NagarBrain AI. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <span style={{ color: '#7a8a7a', fontSize: 13, cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ color: '#7a8a7a', fontSize: 13, cursor: 'pointer' }}>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
