const express = require('express');
const router = express.Router();
const escalationController = require('../controllers/escalationController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Escalation Rules
router.get('/organizations/:organizationId/escalation-rules', escalationController.getEscalationRules);
router.get('/escalation-rules/:id', escalationController.getEscalationRule);
router.post('/escalation-rules', escalationController.createEscalationRule);
router.put('/escalation-rules/:id', escalationController.updateEscalationRule);
router.delete('/escalation-rules/:id', escalationController.deleteEscalationRule);

// Escalation Actions
router.get('/tickets/:ticketId/escalation', escalationController.checkTicketEscalation);
router.post('/escalation-rules/:ruleId/test', escalationController.testEscalationRule);

// Escalation Statistics
router.get('/organizations/:organizationId/escalation-stats', escalationController.getEscalationStats);

// Escalation Targets
router.get('/organizations/:organizationId/escalation-targets', escalationController.getEscalationTargets);

module.exports = router; 