const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication to all audit routes
router.use(authenticateToken);

// Get audit logs with filtering
router.get('/logs', requireRole(['admin', 'manager']), auditController.getAuditLogs);

// Get audit logs for a specific entity
router.get('/logs/:entity_type/:entity_id', requireRole(['admin', 'manager']), auditController.getEntityAuditLogs);

// Get audit summary for dashboard
router.get('/summary', requireRole(['admin', 'manager']), auditController.getAuditSummary);

// Get recent security events
router.get('/security-events', requireRole(['admin', 'manager']), auditController.getSecurityEvents);

// Get user activity summary
router.get('/user-activity/:user_id', requireRole(['admin', 'manager']), auditController.getUserActivity);

// Export audit logs
router.get('/export', requireRole(['admin']), auditController.exportAuditLogs);

// Clean old audit logs (admin only)
router.delete('/clean', requireRole(['admin']), auditController.cleanOldLogs);

// Get audit statistics
router.get('/stats', requireRole(['admin', 'manager']), auditController.getAuditStats);

module.exports = router; 