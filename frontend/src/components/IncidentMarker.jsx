import { Marker } from '@react-google-maps/api';

const TYPE_EMOJI = {
  'Accident':      '🚗',
  'Road Block':    '🚧',
  'Construction':  '🏗️',
  'Heavy Traffic': '⚠️',
  'Bridge Damage': '🌉',
  'Flooding':      '🌊',
  'Fire':          '🔥',
  'Fallen Tree':   '🌳',
  'Other':         '📍',
};

const SEVERITY_COLOR = {
  Low:      '#22c55e',
  Medium:   '#f59e0b',
  High:     '#ef4444',
  Critical: '#7c3aed',
};

const IncidentMarker = ({ incident, onClick }) => {
  const emoji = TYPE_EMOJI[incident.type] || '📍';
  const color = SEVERITY_COLOR[incident.severity] || '#f59e0b';
  const size  = incident.severity === 'Critical' ? 44 : incident.severity === 'High' ? 40 : 36;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="white" stroke="${color}" stroke-width="3"/>
      <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" font-size="${size * 0.52}">${emoji}</text>
    </svg>
  `;

  return (
    <Marker
      position={{ lat: incident.location.lat, lng: incident.location.lng }}
      icon={{
        url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(svg),
        // eslint-disable-next-line no-undef
        anchor: new google.maps.Point(size / 2, size / 2),
      }}
      onClick={() => onClick && onClick(incident)}
      title={`${incident.type} — ${incident.severity || 'Medium'}`}
    />
  );
};

export default IncidentMarker;
