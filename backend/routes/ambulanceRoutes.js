const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ambulanceController');

router.post('/',           ctrl.createRequest);
router.get('/',            ctrl.getRequests);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
