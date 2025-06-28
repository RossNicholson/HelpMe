const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/tickets', reportController.getTicketAnalytics);
router.get('/sla', reportController.getSLACompliance);
router.get('/time-tracking', reportController.getTimeTrackingStats);
router.get('/billing', reportController.getBillingStats);
router.get('/clients', reportController.getClientPerformance);

module.exports = router; 