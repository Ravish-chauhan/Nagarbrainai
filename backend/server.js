require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const trafficRoutes    = require('./routes/trafficRoutes');
const ambulanceRoutes  = require('./routes/ambulanceRoutes');
const stationRoutes    = require('./routes/stationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Set strictQuery to address mongoose deprecation warning
mongoose.set('strictQuery', false);

// Database connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nagarbrain';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected to', mongoURI))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/traffic',   trafficRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/stations',  stationRoutes);

app.get('/', (req, res) => {
  res.send('NagarBrain API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
