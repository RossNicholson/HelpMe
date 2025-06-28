const jwt = require('jsonwebtoken');
const db = require('../utils/database');
const logger = require('../utils/logger');

// Validate JWT secret is configured
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.error('JWT_SECRET environment variable is not properly configured. Must be at least 32 characters long.');
  process.exit(1);
}

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token is required'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.id) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format'
        });
      }

      // Get user with organization_id from user_organizations table
      const user = await db('users')
        .join('user_organizations', 'users.id', 'user_organizations.user_id')
        .where('users.id', decoded.id)
        .where('users.is_active', true)
        .where('user_organizations.is_active', true)
        .select(
          'users.*',
          'user_organizations.organization_id'
        )
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
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } else {
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
        .join('user_organizations', 'users.id', 'user_organizations.user_id')
        .where('users.id', decoded.id)
        .where('users.is_active', true)
        .where('user_organizations.is_active', true)
        .select(
          'users.*',
          'user_organizations.organization_id'
        )
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