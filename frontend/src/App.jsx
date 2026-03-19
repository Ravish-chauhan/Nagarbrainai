import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import HomePage           from './pages/HomePage';
import RoleSelect         from './pages/RoleSelect';
import UserDashboard      from './pages/UserDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import TrafficSignalPage  from './pages/TrafficSignalPage';
import IncidentAdminPanel from './pages/IncidentAdminPanel';

const GOOGLE_LIBRARIES = ['places'];

function App() {
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
      libraries={GOOGLE_LIBRARIES}
      loadingElement={
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontWeight: 600, fontSize: 14 }}>Loading NagarBrain…</p>
          </div>
        </div>
      }
    >
      <Router>
        <Routes>
          <Route path="/"                  element={<HomePage />} />
          <Route path="/dashboard"          element={<RoleSelect />} />
          <Route path="/user"               element={<UserDashboard />} />
          <Route path="/admin"              element={<AmbulanceDashboard />} />
          <Route path="/signals"            element={<TrafficSignalPage />} />
          <Route path="/incident-admin"     element={<IncidentAdminPanel />} />
        </Routes>
      </Router>
    </LoadScript>
  );
}

export default App;
