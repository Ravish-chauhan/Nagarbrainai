const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Accident', 'Road Block', 'Construction', 'Heavy Traffic', 'Bridge Damage', 'Flooding', 'Fire', 'Fallen Tree', 'Other'],
    required: true,
  },
  description: { type: String, default: '' },
  severity:    { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: {
    lat:     { type: Number, required: true },
    lng:     { type: Number, required: true },
    address: { type: String, default: '' },
  },
  reportedBy: { type: String, default: 'Anonymous' },
  verified:   { type: Boolean, default: false },
  active:     { type: Boolean, default: true },
  imageUrl:   { type: String, default: '' },
  aiResult:   { type: Object, default: null },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Incident', incidentSchema);
