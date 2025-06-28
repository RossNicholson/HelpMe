const express = require('express');
const router = express.Router();
const slaController = require('../controllers/slaController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// SLA Definitions
router.get('/organizations/:organizationId/sla-definitions', slaController.getSLADefinitions);
router.get('/sla-definitions/:id', slaController.getSLADefinition);
router.post('/sla-definitions', slaController.createSLADefinition);
router.put('/sla-definitions/:id', slaController.updateSLADefinition);
router.delete('/sla-definitions/:id', slaController.deleteSLADefinition);

// SLA Violations
router.get('/organizations/:organizationId/sla-violations', slaController.getSLAViolations);

// SLA Statistics
router.get('/organizations/:organizationId/sla-stats', slaController.getSLAStats);

// SLA Calculations
router.post('/calculate-sla-due-date', slaController.calculateSLADueDate);
router.get('/tickets/:ticketId/sla-violations', slaController.checkTicketSLAViolations);

module.exports = router; 