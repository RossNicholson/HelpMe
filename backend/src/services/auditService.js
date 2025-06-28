const { db } = require('../utils/database');
const logger = require('../utils/logger');

class AuditService {
  // Log an audit event
  async logEvent({
    organizationId,
    userId = null,
    action,
    entityType,
    entityId = null,
    entityName = null,
    oldValues = null,
    newValues = null,
    metadata = null,
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    severity = 'low',
    description = null
  }) {
    try {
      const auditLog = {
        organization_id: organizationId,
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
        severity,
        description,
        timestamp: new Date()
      };

      await db('audit_logs').insert(auditLog);
      
      // Also log to application logs for immediate visibility
      logger.info(`AUDIT: ${action} on ${entityType}${entityId ? ` (ID: ${entityId})` : ''} by user ${userId || 'system'}`);
      
      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  // Log user authentication events
  async logAuthEvent(organizationId, userId, action, metadata = {}) {
    return this.logEvent({
      organizationId,
      userId,
      action,
      entityType: 'auth',
      entityId: userId,
      entityName: 'User Authentication',
      metadata,
      severity: action === 'LOGIN_FAILED' ? 'medium' : 'low',
      description: `User ${action.toLowerCase()}`
    });
  }

  // Log CRUD operations
  async logCRUDEvent(organizationId, userId, action, entityType, entityId, entityName, oldValues = null, newValues = null, metadata = {}) {
    let severity = 'low';
    
    // Determine severity based on action and entity type
    if (action === 'DELETE') {
      severity = 'high';
    } else if (action === 'UPDATE' && (entityType === 'users' || entityType === 'contracts')) {
      severity = 'medium';
    } else if (entityType === 'tickets' && action === 'UPDATE') {
      severity = 'medium';
    }

    return this.logEvent({
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      entityName,
      oldValues,
      newValues,
      metadata,
      severity,
      description: `${action} ${entityType}${entityId ? ` (ID: ${entityId})` : ''}`
    });
  }

  // Log security events
  async logSecurityEvent(organizationId, userId, action, description, metadata = {}) {
    return this.logEvent({
      organizationId,
      userId,
      action,
      entityType: 'security',
      entityName: 'Security Event',
      metadata,
      severity: 'high',
      description
    });
  }

  // Get audit logs with filtering
  async getAuditLogs(organizationId, filters = {}) {
    try {
      let query = db('audit_logs')
        .select(
          'audit_logs.*',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name'),
          'users.email as user_email'
        )
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .where('audit_logs.organization_id', organizationId);

      // Apply filters
      if (filters.user_id) {
        query = query.where('audit_logs.user_id', filters.user_id);
      }
      if (filters.action) {
        query = query.where('audit_logs.action', filters.action);
      }
      if (filters.entity_type) {
        query = query.where('audit_logs.entity_type', filters.entity_type);
      }
      if (filters.entity_id) {
        query = query.where('audit_logs.entity_id', filters.entity_id);
      }
      if (filters.severity) {
        query = query.where('audit_logs.severity', filters.severity);
      }
      if (filters.start_date) {
        query = query.where('audit_logs.timestamp', '>=', filters.start_date);
      }
      if (filters.end_date) {
        query = query.where('audit_logs.timestamp', '<=', filters.end_date);
      }
      if (filters.search) {
        query = query.where(function() {
          this.where('audit_logs.description', 'like', `%${filters.search}%`)
            .orWhere('audit_logs.entity_name', 'like', `%${filters.search}%`)
            .orWhere(db.raw('CONCAT(users.first_name, \' \', users.last_name)'), 'like', `%${filters.search}%`);
        });
      }

      const logs = await query
        .orderBy('audit_logs.timestamp', 'desc')
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);

      return logs;
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // Get audit logs for a specific entity
  async getEntityAuditLogs(organizationId, entityType, entityId) {
    try {
      const logs = await db('audit_logs')
        .select(
          'audit_logs.*',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name'),
          'users.email as user_email'
        )
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .where('audit_logs.organization_id', organizationId)
        .where('audit_logs.entity_type', entityType)
        .where('audit_logs.entity_id', entityId)
        .orderBy('audit_logs.timestamp', 'desc');

      return logs;
    } catch (error) {
      logger.error('Error fetching entity audit logs:', error);
      throw error;
    }
  }

  // Get audit summary for dashboard
  async getAuditSummary(organizationId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const summary = await db('audit_logs')
        .where('organization_id', organizationId)
        .where('timestamp', '>=', startDate)
        .select(
          db.raw('COUNT(*) as total_events'),
          db.raw('COUNT(CASE WHEN severity = \'critical\' THEN 1 END) as critical_events'),
          db.raw('COUNT(CASE WHEN severity = \'high\' THEN 1 END) as high_events'),
          db.raw('COUNT(CASE WHEN severity = \'medium\' THEN 1 END) as medium_events'),
          db.raw('COUNT(CASE WHEN action = \'LOGIN\' THEN 1 END) as login_events'),
          db.raw('COUNT(CASE WHEN action = \'DELETE\' THEN 1 END) as delete_events'),
          db.raw('COUNT(DISTINCT user_id) as active_users')
        )
        .first();

      return summary;
    } catch (error) {
      logger.error('Error fetching audit summary:', error);
      throw error;
    }
  }

  // Get recent security events
  async getSecurityEvents(organizationId, limit = 50) {
    try {
      const events = await db('audit_logs')
        .select(
          'audit_logs.*',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name'),
          'users.email as user_email'
        )
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .where('audit_logs.organization_id', organizationId)
        .whereIn('audit_logs.severity', ['high', 'critical'])
        .orderBy('audit_logs.timestamp', 'desc')
        .limit(limit);

      return events;
    } catch (error) {
      logger.error('Error fetching security events:', error);
      throw error;
    }
  }

  // Get user activity summary
  async getUserActivity(organizationId, userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activity = await db('audit_logs')
        .where('organization_id', organizationId)
        .where('user_id', userId)
        .where('timestamp', '>=', startDate)
        .select(
          'action',
          'entity_type',
          db.raw('COUNT(*) as count')
        )
        .groupBy('action', 'entity_type')
        .orderBy('count', 'desc');

      return activity;
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      throw error;
    }
  }

  // Clean old audit logs (retention policy)
  async cleanOldLogs(organizationId, daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await db('audit_logs')
        .where('organization_id', organizationId)
        .where('timestamp', '<', cutoffDate)
        .where('severity', 'low') // Only delete low severity logs
        .del();

      logger.info(`Cleaned ${deletedCount} old audit logs for organization ${organizationId}`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning old audit logs:', error);
      throw error;
    }
  }

  // Export audit logs for compliance
  async exportAuditLogs(organizationId, startDate, endDate, format = 'json') {
    try {
      const logs = await db('audit_logs')
        .select(
          'audit_logs.*',
          db.raw('CONCAT(users.first_name, \' \', users.last_name) as user_name'),
          'users.email as user_email'
        )
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .where('audit_logs.organization_id', organizationId)
        .where('audit_logs.timestamp', '>=', startDate)
        .where('audit_logs.timestamp', '<=', endDate)
        .orderBy('audit_logs.timestamp', 'asc');

      if (format === 'csv') {
        return this.convertToCSV(logs);
      }

      return logs;
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  // Convert logs to CSV format
  convertToCSV(logs) {
    const headers = [
      'ID', 'Organization ID', 'User ID', 'User Name', 'User Email',
      'Action', 'Entity Type', 'Entity ID', 'Entity Name',
      'Old Values', 'New Values', 'Metadata', 'IP Address',
      'User Agent', 'Session ID', 'Severity', 'Description',
      'Timestamp'
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.id,
        log.organization_id,
        log.user_id || '',
        `"${(log.user_name || '').replace(/"/g, '""')}"`,
        `"${(log.user_email || '').replace(/"/g, '""')}"`,
        log.action,
        log.entity_type,
        log.entity_id || '',
        `"${(log.entity_name || '').replace(/"/g, '""')}"`,
        `"${(log.old_values || '').replace(/"/g, '""')}"`,
        `"${(log.new_values || '').replace(/"/g, '""')}"`,
        `"${(log.metadata || '').replace(/"/g, '""')}"`,
        log.ip_address || '',
        `"${(log.user_agent || '').replace(/"/g, '""')}"`,
        log.session_id || '',
        log.severity,
        `"${(log.description || '').replace(/"/g, '""')}"`,
        log.timestamp
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }
}

module.exports = new AuditService(); 