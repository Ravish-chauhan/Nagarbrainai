const Station  = require('../models/stationModel');
const mongoose = require('mongoose');

let inMemory = [];
let idCounter = 1;

exports.getStations = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json(inMemory);
    res.json(await Station.find().sort({ createdAt: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addStation = async (req, res) => {
  try {
    const { name, address, lat, lng } = req.body;
    if (!name || lat == null || lng == null)
      return res.status(400).json({ message: 'name, lat, lng required' });

    if (mongoose.connection.readyState !== 1) {
      const doc = { _id: `mem_${idCounter++}`, name, address, lat, lng, active: true, createdAt: new Date().toISOString() };
      inMemory.push(doc);
      return res.status(201).json(doc);
    }
    const saved = await new Station({ name, address, lat, lng }).save();
    res.status(201).json(saved);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteStation = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      inMemory = inMemory.filter(s => s._id !== id);
      return res.json({ ok: true });
    }
    await Station.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
