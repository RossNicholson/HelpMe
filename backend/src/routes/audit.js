const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all audit routes
router.use(protect);

// Get audit logs with filtering
router.get('/logs', authorize('admin', 'manager'), auditController.getAuditLogs);

// Get audit logs for a specific entity
router.get('/logs/:entity_type/:entity_id', authorize('admin', 'manager'), auditController.getEntityAuditLogs);

// Get audit summary for dashboard
router.get('/summary', authorize('admin', 'manager'), auditController.getAuditSummary);

// Get recent security events
router.get('/security-events', authorize('admin', 'manager'), auditController.getSecurityEvents);

// Get user activity summary
router.get('/user-activity/:user_id', authorize('admin', 'manager'), auditController.getUserActivity);

// Export audit logs
router.get('/export', authorize('admin'), auditController.exportAuditLogs);

// Clean old audit logs (admin only)
router.delete('/clean', authorize('admin'), auditController.cleanOldLogs);

// Get audit statistics
router.get('/stats', authorize('admin', 'manager'), auditController.getAuditStats);

module.exports = router; 