const TrafficLight = ({ state, secondsLeft }) => {
  const isRed    = state === 'red';
  const isYellow = state === 'yellow';
  const isGreen  = state === 'green';

  return (
    <div className="tl-wrap">
      <div className="tl-housing">
        <div className="tl-bulb" style={{
          background: isRed ? '#ef4444' : '#e2e8f0',
          boxShadow:  isRed ? '0 0 10px #ef4444, 0 0 20px #ef444455' : 'none',
        }} />
        <div className="tl-bulb" style={{
          background: isYellow ? '#f59e0b' : '#e2e8f0',
          boxShadow:  isYellow ? '0 0 10px #f59e0b, 0 0 20px #f59e0b55' : 'none',
        }} />
        <div className="tl-bulb" style={{
          background: isGreen ? '#10b981' : '#e2e8f0',
          boxShadow:  isGreen ? '0 0 10px #10b981, 0 0 20px #10b98155' : 'none',
        }} />
      </div>
      <div className="tl-timer" style={{
        color: isGreen ? '#10b981' : isYellow ? '#f59e0b' : '#ef4444',
      }}>
        {secondsLeft}s
      </div>
    </div>
  );
};

export default TrafficLight;
