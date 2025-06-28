const clientPortalService = require('../services/clientPortalService');
const logger = require('../utils/logger');

const clientAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Session token required'
      });
    }

    const session = await clientPortalService.validateSession(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Add client info to request
    req.client = session.client;
    req.session = session.session;

    // Update session with IP and user agent if not set
    if (!session.session.ip_address || !session.session.user_agent) {
      await clientPortalService.updateSessionInfo(sessionToken, {
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    }

    next();
  } catch (error) {
    logger.error('Client auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional auth - doesn't fail if no session
const optionalClientAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;

    if (sessionToken) {
      const session = await clientPortalService.validateSession(sessionToken);
      
      if (session) {
        req.client = session.client;
        req.session = session.session;
      }
    }

    next();
  } catch (error) {
    logger.error('Optional client auth middleware error:', error);
    // Continue without authentication
    next();
  }
};

// Check if portal is enabled for organization
const checkPortalEnabled = async (req, res, next) => {
  try {
    const organizationId = req.params.organization_id || req.client?.organization_id;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID required'
      });
    }

    const settings = await clientPortalService.getPortalSettings(organizationId);
    
    if (!settings.enabled) {
      return res.status(403).json({
        success: false,
        message: 'Client portal is disabled for this organization'
      });
    }

    req.portalSettings = settings;
    next();
  } catch (error) {
    logger.error('Check portal enabled error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check portal status'
    });
  }
};

module.exports = {
  clientAuth,
  optionalClientAuth,
  checkPortalEnabled
}; 