const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  address: { type: String, default: '' },
  lat:     { type: Number, required: true },
  lng:     { type: Number, required: true },
  active:  { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Station', stationSchema);
