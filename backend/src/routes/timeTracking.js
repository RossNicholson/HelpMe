const express = require('express');
const router = express.Router();
const timeTrackingController = require('../controllers/timeTrackingController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Time Entry Routes
router.post('/time-entries', timeTrackingController.createTimeEntry);
router.get('/tickets/:ticket_id/time-entries', timeTrackingController.getTimeEntries);
router.put('/time-entries/:id', timeTrackingController.updateTimeEntry);
router.delete('/time-entries/:id', timeTrackingController.deleteTimeEntry);

// Time Tracking Statistics
router.get('/time-stats', timeTrackingController.getTimeStats);

// Invoice Generation
router.post('/clients/:client_id/generate-invoice', timeTrackingController.generateInvoice);

// Billing Rate Routes
router.post('/billing-rates', timeTrackingController.createBillingRate);
router.get('/billing-rates', timeTrackingController.getBillingRates);
router.put('/billing-rates/:id', timeTrackingController.updateBillingRate);
router.delete('/billing-rates/:id', timeTrackingController.deleteBillingRate);

// Invoice Routes
router.get('/invoices', timeTrackingController.getInvoices);
router.get('/invoices/:id', timeTrackingController.getInvoice);
router.put('/invoices/:id/status', timeTrackingController.updateInvoiceStatus);

// Billing Statistics
router.get('/billing-stats', timeTrackingController.getBillingStats);

module.exports = router; 