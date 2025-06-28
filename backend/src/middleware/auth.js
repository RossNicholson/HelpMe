const jwt = require('jsonwebtoken');
const { db } = require('../utils/database');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await db('users')
        .where('id', decoded.id)
        .where('is_active', true)
        .first();

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found or inactive'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await db('users')
        .where('id', decoded.id)
        .where('is_active', true)
        .first();

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }

  next();
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'User role is not authorized to access this route'
      });
    }

    next();
  };
};

// Organization-based authorization
const authorizeOrganization = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  const organizationId = req.params.organizationId || req.body.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      error: 'Organization ID is required'
    });
  }

  // Check if user belongs to the organization
  const userOrg = await db('user_organizations')
    .where('user_id', req.user.id)
    .where('organization_id', organizationId)
    .first();

  if (!userOrg && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this organization'
    });
  }

  req.organizationId = organizationId;
  next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  authorizeOrganization
}; 