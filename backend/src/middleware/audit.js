const auditService = require('../services/auditService');

// Middleware to automatically log audit events
const auditMiddleware = (action, entityType, getEntityName = null, getMetadata = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Store original request data for audit logging
    const auditData = {
      organizationId: req.user?.organization_id,
      userId: req.user?.id,
      action,
      entityType,
      entityId: req.params.id || req.body.id,
      entityName: null,
      oldValues: null,
      newValues: null,
      metadata: null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.session?.id
    };

    // Get entity name if function provided
    if (getEntityName) {
      try {
        auditData.entityName = await getEntityName(req, res);
      } catch (error) {
        // Continue without entity name if function fails
      }
    }

    // Get metadata if function provided
    if (getMetadata) {
      try {
        auditData.metadata = await getMetadata(req, res);
      } catch (error) {
        // Continue without metadata if function fails
      }
    }

    // Override res.send to capture response data
    res.send = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Log successful operations
          auditService.logEvent(auditData);
        }
      } catch (error) {
        // Don't let audit logging break the response
        console.error('Audit logging error:', error);
      }
      return originalSend.call(this, data);
    };

    // Override res.json to capture response data
    res.json = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // For successful operations, capture new values
          if (data && data.data) {
            auditData.newValues = data.data;
          }
          auditService.logEvent(auditData);
        }
      } catch (error) {
        // Don't let audit logging break the response
        console.error('Audit logging error:', error);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Middleware to log authentication events
const auditAuth = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          auditService.logAuthEvent(
            req.user?.organization_id,
            req.user?.id,
            action,
            {
              ip_address: req.ip || req.connection.remoteAddress,
              user_agent: req.get('User-Agent'),
              session_id: req.session?.id
            }
          );
        }
      } catch (error) {
        console.error('Auth audit logging error:', error);
      }
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          auditService.logAuthEvent(
            req.user?.organization_id,
            req.user?.id,
            action,
            {
              ip_address: req.ip || req.connection.remoteAddress,
              user_agent: req.get('User-Agent'),
              session_id: req.session?.id
            }
          );
        }
      } catch (error) {
        console.error('Auth audit logging error:', error);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Middleware to log CRUD operations
const auditCRUD = (action, entityType, getEntityName = null, getMetadata = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    const auditData = {
      organizationId: req.user?.organization_id,
      userId: req.user?.id,
      action,
      entityType,
      entityId: req.params.id || req.body.id,
      entityName: null,
      oldValues: null,
      newValues: null,
      metadata: null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.session?.id
    };

    // For UPDATE operations, try to get old values
    if (action === 'UPDATE' && req.params.id) {
      try {
        // This would need to be implemented based on your data access layer
        // For now, we'll skip old values
      } catch (error) {
        // Continue without old values
      }
    }

    // Get entity name if function provided
    if (getEntityName) {
      try {
        auditData.entityName = await getEntityName(req, res);
      } catch (error) {
        // Continue without entity name
      }
    }

    // Get metadata if function provided
    if (getMetadata) {
      try {
        auditData.metadata = await getMetadata(req, res);
      } catch (error) {
        // Continue without metadata
      }
    }

    // For CREATE operations, capture the request body as new values
    if (action === 'CREATE') {
      auditData.newValues = req.body;
    }

    // For UPDATE operations, capture the request body as new values
    if (action === 'UPDATE') {
      auditData.newValues = req.body;
    }

    res.send = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          auditService.logCRUDEvent(
            auditData.organizationId,
            auditData.userId,
            auditData.action,
            auditData.entityType,
            auditData.entityId,
            auditData.entityName,
            auditData.oldValues,
            auditData.newValues,
            auditData.metadata
          );
        }
      } catch (error) {
        console.error('CRUD audit logging error:', error);
      }
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Update new values with response data if available
          if (data && data.data) {
            auditData.newValues = data.data;
          }
          auditService.logCRUDEvent(
            auditData.organizationId,
            auditData.userId,
            auditData.action,
            auditData.entityType,
            auditData.entityId,
            auditData.entityName,
            auditData.oldValues,
            auditData.newValues,
            auditData.metadata
          );
        }
      } catch (error) {
        console.error('CRUD audit logging error:', error);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Middleware to log security events
const auditSecurity = (action, description, getMetadata = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    let metadata = {
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      session_id: req.session?.id
    };

    if (getMetadata) {
      try {
        const additionalMetadata = await getMetadata(req, res);
        metadata = { ...metadata, ...additionalMetadata };
      } catch (error) {
        // Continue without additional metadata
      }
    }

    res.send = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          auditService.logSecurityEvent(
            req.user?.organization_id,
            req.user?.id,
            action,
            description,
            metadata
          );
        }
      } catch (error) {
        console.error('Security audit logging error:', error);
      }
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          auditService.logSecurityEvent(
            req.user?.organization_id,
            req.user?.id,
            action,
            description,
            metadata
          );
        }
      } catch (error) {
        console.error('Security audit logging error:', error);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  auditMiddleware,
  auditAuth,
  auditCRUD,
  auditSecurity
}; 