const AmbulanceRequest = require('../models/ambulanceRequestModel');
const mongoose = require('mongoose');

let inMemory = [];
let idCounter = 1;

exports.createRequest = async (req, res) => {
  try {
    const { userName, phone, description, location } = req.body;
    if (!location?.lat || !location?.lng)
      return res.status(400).json({ message: 'Location is required' });

    if (mongoose.connection.readyState !== 1) {
      const doc = { _id: `mem_${idCounter++}`, userName, phone, description, location, status: 'pending', createdAt: new Date().toISOString() };
      inMemory.unshift(doc);
      return res.status(201).json(doc);
    }
    const saved = await new AmbulanceRequest({ userName, phone, description, location }).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1)
      return res.json(inMemory);
    const docs = await AmbulanceRequest.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedStation } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const item = inMemory.find(r => r._id === id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      item.status = status;
      if (assignedStation) item.assignedStation = assignedStation;
      return res.json(item);
    }
    const updated = await AmbulanceRequest.findByIdAndUpdate(
      id, { status, assignedStation }, { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
