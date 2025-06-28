const auditService = require('../services/auditService');
const logger = require('../utils/logger');

class AuditController {
  // Get audit logs with filtering
  async getAuditLogs(req, res) {
    try {
      const { organization_id } = req.user;
      const {
        user_id,
        action,
        entity_type,
        entity_id,
        severity,
        start_date,
        end_date,
        search,
        limit = 100,
        offset = 0
      } = req.query;

      const filters = {
        user_id: user_id ? parseInt(user_id) : null,
        action,
        entity_type,
        entity_id: entity_id ? parseInt(entity_id) : null,
        severity,
        start_date,
        end_date,
        search,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      // Remove null/undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined) {
          delete filters[key];
        }
      });

      const logs = await auditService.getAuditLogs(organization_id, filters);

      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: logs.length
        }
      });
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  }

  // Get audit logs for a specific entity
  async getEntityAuditLogs(req, res) {
    try {
      const { organization_id } = req.user;
      const { entity_type, entity_id } = req.params;

      if (!entity_type || !entity_id) {
        return res.status(400).json({
          success: false,
          message: 'Entity type and entity ID are required'
        });
      }

      const logs = await auditService.getEntityAuditLogs(
        organization_id,
        entity_type,
        parseInt(entity_id)
      );

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      logger.error('Error fetching entity audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch entity audit logs',
        error: error.message
      });
    }
  }

  // Get audit summary for dashboard
  async getAuditSummary(req, res) {
    try {
      const { organization_id } = req.user;
      const { days = 30 } = req.query;

      const summary = await auditService.getAuditSummary(
        organization_id,
        parseInt(days)
      );

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error fetching audit summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit summary',
        error: error.message
      });
    }
  }

  // Get recent security events
  async getSecurityEvents(req, res) {
    try {
      const { organization_id } = req.user;
      const { limit = 50 } = req.query;

      const events = await auditService.getSecurityEvents(
        organization_id,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      logger.error('Error fetching security events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security events',
        error: error.message
      });
    }
  }

  // Get user activity summary
  async getUserActivity(req, res) {
    try {
      const { organization_id } = req.user;
      const { user_id } = req.params;
      const { days = 30 } = req.query;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const activity = await auditService.getUserActivity(
        organization_id,
        parseInt(user_id),
        parseInt(days)
      );

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activity',
        error: error.message
      });
    }
  }

  // Export audit logs
  async exportAuditLogs(req, res) {
    try {
      const { organization_id } = req.user;
      const { start_date, end_date, format = 'json' } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const logs = await auditService.exportAuditLogs(
        organization_id,
        new Date(start_date),
        new Date(end_date),
        format
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${start_date}_${end_date}.csv"`);
        res.send(logs);
      } else {
        res.json({
          success: true,
          data: logs
        });
      }
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: error.message
      });
    }
  }

  // Clean old audit logs (admin only)
  async cleanOldLogs(req, res) {
    try {
      const { organization_id } = req.user;
      const { days_to_keep = 365 } = req.query;

      // Check if user has admin privileges
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin privileges required to clean audit logs'
        });
      }

      const deletedCount = await auditService.cleanOldLogs(
        organization_id,
        parseInt(days_to_keep)
      );

      res.json({
        success: true,
        message: `Cleaned ${deletedCount} old audit logs`,
        data: { deleted_count: deletedCount }
      });
    } catch (error) {
      logger.error('Error cleaning old audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean old audit logs',
        error: error.message
      });
    }
  }

  // Get audit log statistics
  async getAuditStats(req, res) {
    try {
      const { organization_id } = req.user;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get summary
      const summary = await auditService.getAuditSummary(organization_id, parseInt(days));

      // Get top actions
      const topActions = await auditService.getAuditLogs(organization_id, {
        start_date: startDate,
        limit: 1000
      });

      // Group by action
      const actionStats = topActions.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      // Get top entity types
      const entityStats = topActions.reduce((acc, log) => {
        acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
        return acc;
      }, {});

      // Get top users
      const userStats = topActions.reduce((acc, log) => {
        if (log.user_id) {
          const userName = log.user_name || `User ${log.user_id}`;
          acc[userName] = (acc[userName] || 0) + 1;
        }
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          summary,
          top_actions: Object.entries(actionStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([action, count]) => ({ action, count })),
          top_entities: Object.entries(entityStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([entity_type, count]) => ({ entity_type, count })),
          top_users: Object.entries(userStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([user_name, count]) => ({ user_name, count }))
        }
      });
    } catch (error) {
      logger.error('Error fetching audit stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit statistics',
        error: error.message
      });
    }
  }
}

module.exports = new AuditController(); 