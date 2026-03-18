const mongoose = require('mongoose');

const ambulanceRequestSchema = new mongoose.Schema({
  userName:    { type: String, default: 'Anonymous' },
  phone:       { type: String, default: '' },
  description: { type: String, default: '' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['pending', 'dispatched', 'completed', 'cancelled'],
    default: 'pending',
  },
  assignedStation: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AmbulanceRequest', ambulanceRequestSchema);
