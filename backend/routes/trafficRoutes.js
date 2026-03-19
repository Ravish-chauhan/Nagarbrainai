const express = require('express');
const router  = express.Router();
const tc      = require('../controllers/trafficController');

router.get('/incidents',              tc.getIncidents);
router.post('/incidents',             tc.addIncident);
router.delete('/incidents/:id',       tc.deleteIncident);
router.patch('/incidents/:id/verify', tc.verifyIncident);
router.patch('/incidents/:id/resolve',tc.resolveIncident);
router.post('/detect-traffic',        tc.detectTraffic);

module.exports = router;
