const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/stationController');

router.get('/',      ctrl.getStations);
router.post('/',     ctrl.addStation);
router.delete('/:id', ctrl.deleteStation);

module.exports = router;
