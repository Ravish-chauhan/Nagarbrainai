import { useNavigate } from 'react-router-dom';
import { Brain, User, Siren, AlertTriangle } from 'lucide-react';

const RoleSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="role-root">
      <div className="role-card-wrap">

        {/* Logo */}
        <div className="role-logo-row">
          <div className="role-logo-icon">
            <Brain size={28} color="#fff" />
          </div>
          <div>
            <h1 className="role-title">NagarBrain</h1>
            <p className="role-sub">AI Traffic Intelligence Platform</p>
          </div>
        </div>

        <p className="role-prompt">Select your role to continue</p>

        <div className="role-options">
          {/* User */}
          <button className="role-option user" onClick={() => navigate('/user')}>
            <div className="role-option-icon user">
              <User size={32} />
            </div>
            <div className="role-option-text">
              <span className="role-option-title">Citizen / User</span>
              <span className="role-option-desc">Report incidents, plan routes, request ambulance</span>
            </div>
            <div className="role-option-arrow">→</div>
          </button>

          {/* Admin */}
          <button className="role-option admin" onClick={() => navigate('/admin')}>
            <div className="role-option-icon admin">
              <Siren size={32} />
            </div>
            <div className="role-option-text">
              <span className="role-option-title">Ambulance Admin</span>
              <span className="role-option-desc">Manage requests, dispatch ambulances, view routes</span>
            </div>
            <div className="role-option-arrow">→</div>
          </button>

          {/* Incident Admin */}
          <button className="role-option" onClick={() => navigate('/incident-admin')}
            style={{ borderColor: '#ef4444', background: 'linear-gradient(135deg,#fef2f2,#fff)' }}>
            <div className="role-option-icon" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
              <AlertTriangle size={32} />
            </div>
            <div className="role-option-text">
              <span className="role-option-title">Incident Admin</span>
              <span className="role-option-desc">Review, verify and remove map incidents</span>
            </div>
            <div className="role-option-arrow">→</div>
          </button>
        </div>

        <p className="role-footer">NagarBrain · Smart City Emergency Response</p>
      </div>
    </div>
  );
};

export default RoleSelect;
