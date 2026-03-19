const Incident = require('../models/incidentModel');
const axios = require('axios');
const mongoose = require('mongoose');

let inMemoryIncidents = [];
let idCounter = 1;

const HF_ROUTER = 'https://router.huggingface.co/hf-inference/models';

// ── Helpers ──────────────────────────────────────────────────────────────────

const hfPost = async (model, buffer, token) => {
  const res = await axios.post(`${HF_ROUTER}/${model}`, buffer, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'x-wait-for-model': 'true',   // wait if model is loading (cold start)
    },
    timeout: 60000,
  });
  return res.data;
};

const getCongestionLevel = (vehicleCount) => {
  if (vehicleCount >= 15) return 'High';
  if (vehicleCount >= 6)  return 'Medium';
  return 'Low';
};

// ── Controllers ──────────────────────────────────────────────────────────────

exports.getIncidents = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1)
      return res.json(inMemoryIncidents.slice().reverse());
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addIncident = async (req, res) => {
  try {
    const { type, description = '', location, reportedBy = 'Anonymous', imageUrl = '', aiResult = null } = req.body;

    const text = `${type} ${description}`.toLowerCase();
    let severity = aiResult?.severity || 'Medium';
    if (!aiResult?.severity) {
      if (type === 'Bridge Damage' || type === 'Fire' || text.includes('fatal') || text.includes('dead') || text.includes('collapse') || text.includes('major') || text.includes('severe') || text.includes('critical')) severity = 'Critical';
      else if (type === 'Accident' || type === 'Flooding' || text.includes('injur') || text.includes('block') || text.includes('flood') || text.includes('high') || text.includes('serious')) severity = 'High';
      else if (type === 'Construction' || type === 'Fallen Tree' || text.includes('slow') || text.includes('minor') || text.includes('partial')) severity = 'Low';
    }

    if (mongoose.connection.readyState !== 1) {
      const newIncident = {
        _id: `mem_${idCounter++}`, type, description, severity,
        location, reportedBy, verified: true, active: true,
        imageUrl, aiResult, createdAt: new Date().toISOString(),
      };
      inMemoryIncidents.push(newIncident);
      return res.status(201).json(newIncident);
    }
    const saved = await new Incident({ type, description, severity, location, reportedBy, verified: true, imageUrl, aiResult }).save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      inMemoryIncidents = inMemoryIncidents.filter(i => i._id !== id);
      return res.json({ message: 'Deleted' });
    }
    await Incident.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verifyIncident = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      const inc = inMemoryIncidents.find(i => i._id === id);
      if (!inc) return res.status(404).json({ message: 'Not found' });
      inc.verified = true;
      return res.json(inc);
    }
    const updated = await Incident.findByIdAndUpdate(id, { verified: true }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState !== 1) {
      const inc = inMemoryIncidents.find(i => i._id === id);
      if (!inc) return res.status(404).json({ message: 'Not found' });
      inc.active = false;
      return res.json(inc);
    }
    const updated = await Incident.findByIdAndUpdate(id, { active: false }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.detectTraffic = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64)
      return res.status(400).json({ message: 'Image data is required' });

    const token = process.env.HF_API_TOKEN;

    // ── No token: return mock ─────────────────────────────────────────────
    if (!token) {
      return res.json({
        vehicleCount: Math.floor(Math.random() * 20) + 1,
        accidentDetected: Math.random() > 0.7,
        ambulanceDetected: Math.random() > 0.85,
        congestionLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        detections: [],
        mocked: true,
      });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // ── Call 1: gopesh353 model — accident + vehicle detection ────────────
    let accidentDetections = [];
    let vehicleDetections = [];
    let accidentDetected = false;

    try {
      const trafficResults = await hfPost(
        'gopesh353/traffic-accident-detection-detr',
        buffer,
        token
      );

      // Model labels: "accident" (id 0,1) and "vehicle" (id 2)
      accidentDetections = trafficResults.filter(
        d => d.label?.toLowerCase().includes('accident') && d.score > 0.4
      );
      vehicleDetections = trafficResults.filter(
        d => d.label?.toLowerCase().includes('vehicle') && d.score > 0.3
      );
      accidentDetected = accidentDetections.length > 0;
    } catch (err) {
      console.error('[gopesh353 model error]', err.response?.data || err.message);
    }

    // ── Call 2: COCO DETR — ambulance + extra vehicle detection ──────────
    let ambulanceDetected = false;
    let ambulanceCount = 0;
    let ambulanceDetections = [];
    let cocoVehicleDetections = [];

    try {
      const cocoResults = await hfPost('facebook/detr-resnet-50', buffer, token);

      const vehicleLabels = ['car', 'truck', 'bus', 'motorcycle', 'bicycle'];
      cocoVehicleDetections = cocoResults.filter(
        d => vehicleLabels.includes(d.label?.toLowerCase()) && d.score > 0.3
      );

      ambulanceDetections = cocoResults.filter(
        d => ['ambulance', 'fire truck', 'police car'].includes(d.label?.toLowerCase()) && d.score > 0.35
      );

      ambulanceDetected = ambulanceDetections.length > 0;
      ambulanceCount    = ambulanceDetections.length;
    } catch (err) {
      console.error('[COCO model error]', err.response?.data || err.message);
    }

    // Merge vehicle counts from both models (deduplicate by proximity is complex, just sum unique)
    const allVehicles = [...vehicleDetections, ...cocoVehicleDetections];
    const vehicleCount = allVehicles.length;
    const congestionLevel = getCongestionLevel(vehicleCount);

    // ── Build alert messages ──────────────────────────────────────────────
    const alerts = [];
    if (accidentDetected)
      alerts.push({ type: 'accident', message: `${accidentDetections.length} accident(s) detected — avoid this area`, severity: 'critical' });
    if (ambulanceDetected)
      alerts.push({ type: 'ambulance', message: `Emergency vehicle detected — clear the path`, severity: 'emergency' });
    if (congestionLevel === 'High')
      alerts.push({ type: 'congestion', message: `High vehicle density (${vehicleCount} vehicles) — expect delays`, severity: 'high' });

    res.json({
      vehicleCount,
      accidentDetected,
      ambulanceDetected,
      ambulanceCount,
      congestionLevel,
      alerts,
      detections: {
        accidents:  accidentDetections.map(d => ({ score: Math.round(d.score * 100), box: d.box })),
        vehicles:   allVehicles.map(d => ({ score: Math.round(d.score * 100), box: d.box })),
        ambulances: ambulanceDetections.map(d => ({ score: Math.round(d.score * 100), box: d.box })),
      },
      mocked: false,
    });

  } catch (error) {
    console.error('[detectTraffic error]', error.response?.data || error.message);
    res.status(500).json({ message: 'Traffic detection failed', error: error.message });
  }
};
