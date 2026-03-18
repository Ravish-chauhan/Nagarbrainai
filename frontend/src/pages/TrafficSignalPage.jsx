import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Activity, Car, Timer, Zap, ArrowLeft, FolderOpen, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LaneBox from '../components/LaneBox';

const LANES = [
  { id: 0, label: 'Lane A', dir: 'North' },
  { id: 1, label: 'Lane B', dir: 'South' },
  { id: 2, label: 'Lane C', dir: 'East'  },
  { id: 3, label: 'Lane D', dir: 'West'  },
];

const YELLOW_DURATION = 3;
const GREEN_BY_DENSITY = { High: 30, Medium: 20, Low: 10 };
const getDuration = (density) => GREEN_BY_DENSITY[density] ?? 10;

const initLaneData = () => LANES.map(l => ({
  ...l,
  vehicleCount:      0,
  density:           'Low',
  hasData:           false,
  emergencyDetected: false,
  ambulanceCount:    0,
}));

const TrafficSignalPage = () => {
  const navigate = useNavigate();

  const [laneData,    setLaneData]    = useState(initLaneData());
  const [activeLane,  setActiveLane]  = useState(null);
  const [phase,       setPhase]       = useState('green');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cycleLog,    setCycleLog]    = useState([]);
  const [totalCycles, setTotalCycles] = useState(0);
  const [yoloOnline,  setYoloOnline]  = useState(false);
  const [bulkSrcs,    setBulkSrcs]    = useState([null, null, null, null]);

  const phaseRef        = useRef(phase);
  const activeRef       = useRef(activeLane);
  const laneDataRef     = useRef(laneData);
  const queueRef        = useRef([]);
  const sequenceRef     = useRef([1, 2, 3, 0]);
  const emergencyActive = useRef(false);

  phaseRef.current    = phase;
  activeRef.current   = activeLane;
  laneDataRef.current = laneData;

  useEffect(() => {
    const check = async () => {
      try { setYoloOnline((await fetch('http://localhost:8000/health')).ok); }
      catch { setYoloOnline(false); }
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, []);

  const hasAnyData    = laneData.some(l => l.hasData);
  const hasAnyDataRef = useRef(hasAnyData);
  hasAnyDataRef.current = hasAnyData;

  useEffect(() => {
    const timer = setInterval(() => {
      if (!hasAnyDataRef.current) return;
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1;
        if (phaseRef.current === 'green') {
          setPhase('yellow');
          return YELLOW_DURATION;
        }
        if (queueRef.current.length === 0) {
          queueRef.current = [0, 1, 2, 3].filter(id => id !== activeRef.current);
        }
        const nextId        = queueRef.current[0];
        const remaining     = queueRef.current.slice(1);
        queueRef.current    = remaining;
        sequenceRef.current = [...remaining, activeRef.current];
        emergencyActive.current = false;

        const nextLane = laneDataRef.current.find(l => l.id === nextId);
        const dur      = getDuration(nextLane?.density ?? 'Low');
        setActiveLane(nextId);
        setPhase('green');
        setTotalCycles(c => c + 1);
        setCycleLog(log => [{
          time:    new Date().toLocaleTimeString(),
          lane:    LANES[nextId].label,
          density: nextLane?.density ?? 'Low',
          dur,
        }, ...log.slice(0, 9)]);
        return dur;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!hasAnyData || startedRef.current) return;
    startedRef.current = true;
    const firstId = 0;
    const dur     = getDuration(laneDataRef.current[firstId]?.density ?? 'Low');
    queueRef.current    = [1, 2, 3];
    sequenceRef.current = [1, 2, 3];
    setActiveLane(firstId);
    setPhase('green');
    setSecondsLeft(dur);
    setCycleLog([{
      time:    new Date().toLocaleTimeString(),
      lane:    LANES[firstId].label,
      density: laneDataRef.current[firstId]?.density ?? 'Low',
      dur,
    }]);
  }, [hasAnyData]);

  const handleDetection = useCallback((laneId, data) => {
    setLaneData(prev => prev.map(l =>
      l.id === laneId ? {
        ...l,
        vehicleCount:      data.vehicleCount,
        density:           data.density,
        hasData:           true,
        emergencyDetected: !!data.emergencyDetected,
        ambulanceCount:    data.emergencyDetected ? (l.ambulanceCount + 1) : l.ambulanceCount,
      } : l
    ));

    if (
      data.emergencyDetected &&
      !(laneId === activeRef.current && phaseRef.current === 'green')
    ) {
      emergencyActive.current = true;
      const dur  = 30;
      const rest = sequenceRef.current.filter(id => id !== laneId);
      queueRef.current = rest;
      setActiveLane(laneId);
      setPhase('green');
      setSecondsLeft(dur);
      setCycleLog(log => [{
        time:      new Date().toLocaleTimeString(),
        lane:      LANES[laneId].label,
        density:   'High',
        dur,
        emergency: true,
      }, ...log.slice(0, 9)]);
    }
  }, []);

  const getSignalState = (laneId) => {
    if (activeLane === null) return 'red';
    if (laneId !== activeLane) return 'red';
    return phase === 'yellow' ? 'yellow' : 'green';
  };

  const getWaitSeconds = (laneId) => {
    if (activeLane === null) return 0;
    if (laneId === activeLane) return secondsLeft;
    const q   = queueRef.current;
    const pos = q.indexOf(laneId);
    if (pos === -1) return 0;
    let wait = secondsLeft + YELLOW_DURATION;
    for (let i = 0; i < pos; i++) {
      const d = laneDataRef.current.find(l => l.id === q[i])?.density ?? 'Low';
      wait += getDuration(d) + YELLOW_DURATION;
    }
    return wait;
  };

  const handleBulkUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    const srcs  = [null, null, null, null];
    files.forEach((f, i) => { srcs[i] = URL.createObjectURL(f); });
    setBulkSrcs(srcs);
    e.target.value = '';
  };

  const totalVehicles = laneData.reduce((s, l) => s + l.vehicleCount, 0);
  const anyEmergency  = laneData.some(l => l.emergencyDetected);
  const emergencyLane = laneData.find(l => l.emergencyDetected);
  const highCount     = laneData.filter(l => l.density === 'High').length;

  return (
    <div className="dash-root">

      {/* ── Header ── */}
      <header className="dash-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="back-btn">
            <ArrowLeft size={16} />
          </button>
          <div className="header-logo">
            <Brain size={18} color="#fff" />
          </div>
          <div>
            <h1 className="header-title">NagarBrain · Signal Control</h1>
            <p className="header-sub">Adaptive Traffic Management · YOLOv8</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {anyEmergency && (
            <div className="emergency-pill animate-pulse">
              🚑 AMBULANCE — {emergencyLane?.label} PRIORITY
            </div>
          )}

          <label className="upload-btn" title="Select up to 4 videos">
            <FolderOpen size={14} />
            <span>Load 4 Lanes</span>
            <input type="file" className="hidden" accept="video/*" multiple onChange={handleBulkUpload} />
          </label>

          <div className={`status-pill ${yoloOnline ? 'online' : 'offline'}`}>
            {yoloOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>YOLOv8 {yoloOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* ── Summary bar ── */}
      <div className="summary-bar">
        <div className="summary-item">
          <Car size={15} className="summary-icon blue" />
          <span className="summary-val">{totalVehicles}</span>
          <span className="summary-label">Total Vehicles</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <Zap size={15} className="summary-icon green" />
          <span className="summary-val">{activeLane !== null ? LANES[activeLane].label : '—'}</span>
          <span className="summary-label">{activeLane !== null ? `${secondsLeft}s · ${phase}` : 'waiting'}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <Timer size={15} className="summary-icon purple" />
          <span className="summary-val">{totalCycles}</span>
          <span className="summary-label">Cycles Done</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <span className="summary-val red">{highCount}</span>
          <span className="summary-label">High Density Lanes</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <Activity size={15} className="summary-icon orange" />
          <span className="summary-val orange">{laneData.reduce((s, l) => s + l.ambulanceCount, 0)}</span>
          <span className="summary-label">Ambulances Detected</span>
        </div>
      </div>

      {/* ── 4-lane grid ── */}
      <div className="lane-grid">
        {LANES.map(lane => (
          <LaneBox
            key={lane.id}
            laneId={lane.id}
            label={lane.label}
            dir={lane.dir}
            signalState={getSignalState(lane.id)}
            secondsLeft={getWaitSeconds(lane.id)}
            onDetection={handleDetection}
            bulkSrc={bulkSrcs[lane.id]}
            laneStats={laneData[lane.id]}
          />
        ))}
      </div>

      {/* ── Cycle log ── */}
      <div className="cycle-log-bar">
        <span className="cycle-log-title"><Activity size={12} /> Switch Log</span>
        {cycleLog.length === 0
          ? <span className="cycle-empty">Waiting for first cycle…</span>
          : cycleLog.slice(0, 6).map((log, i) => (
            <div key={i} className={`cycle-chip ${log.emergency ? 'emergency' : ''}`}>
              {log.emergency ? '🚑' : '⚡'} {log.lane} · {log.density} · {log.dur}s
              <span className="cycle-time">{log.time}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default TrafficSignalPage;
