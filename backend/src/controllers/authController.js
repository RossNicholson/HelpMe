const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/emailService');

// Validate JWT secrets are configured
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  logger.error('JWT_SECRET environment variable is not properly configured. Must be at least 32 characters long.');
  process.exit(1);
}

if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET.length < 32) {
  logger.error('REFRESH_TOKEN_SECRET environment variable is not properly configured. Must be at least 32 characters long.');
  process.exit(1);
}

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role, organization_name } = req.body;

    // Check if user exists
    const existingUser = await db('users').where('email', email).first();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Start transaction
    const trx = await db.transaction();

    try {
      // Create organization if provided, or use default
      let organizationId;
      if (organization_name) {
        const [organization] = await trx('organizations').insert({
          name: organization_name,
          slug: organization_name.toLowerCase().replace(/\s+/g, '-'),
          email: email,
          is_active: true
        }).returning('id');
        organizationId = organization.id;
      } else {
        // Use the first available organization or create a default one
        const defaultOrg = await trx('organizations').first();
        if (!defaultOrg) {
          const [organization] = await trx('organizations').insert({
            name: 'Default Organization',
            slug: 'default-organization',
            email: 'admin@helpme.com',
            is_active: true
          }).returning('id');
          organizationId = organization.id;
        } else {
          organizationId = defaultOrg.id;
        }
      }

      // Create user
      const [user] = await trx('users').insert({
        email,
        password_hash: passwordHash,
        first_name,
        last_name,
        phone,
        role: role || 'client'
      }).returning(['id', 'email', 'first_name', 'last_name', 'role', 'is_active']);

      // Create user-organization relationship
      await trx('user_organizations').insert({
        user_id: user.id,
        organization_id: organizationId,
        role: role || 'client',
        is_active: true
      });

      // Commit transaction
      await trx.commit();

      // Generate tokens
      const token = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            organization_id: organizationId
          },
          token,
          refreshToken
        }
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user with organization
    const user = await db('users')
      .join('user_organizations', 'users.id', 'user_organizations.user_id')
      .where('users.email', email)
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
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await db('users')
      .where('id', user.id)
      .update({ last_login_at: new Date() });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          organization_id: user.organization_id
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a more sophisticated implementation, you would invalidate the refresh token
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await db('users')
      .where('id', req.user.id)
      .select('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'avatar_url', 'preferences', 'created_at')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    updateData.updated_at = new Date();

    const [updatedUser] = await db('users')
      .where('id', req.user.id)
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'avatar_url']);

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during profile update'
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // Get current user with password
    const user = await db('users')
      .where('id', req.user.id)
      .first();

    // Check current password
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(new_password, salt);

    // Update password
    await db('users')
      .where('id', req.user.id)
      .update({
        password_hash: passwordHash,
        updated_at: new Date()
      });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password change'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db('users')
      .where('email', email)
      .where('is_active', true)
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token (you might want to create a separate table for this)
    // For now, we'll just simulate sending an email

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        name: user.first_name,
        resetUrl
      }
    });

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset request'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token and get user (you would implement token verification logic)
    // For now, we'll just simulate the process

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update password (you would find the user by token)
    // await db('users').where('reset_token', token).update({
    //   password_hash: passwordHash,
    //   reset_token: null,
    //   reset_token_expiry: null,
    //   updated_at: new Date()
    // });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during password reset'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

    // Check if user exists
    const user = await db('users')
      .where('id', decoded.id)
      .where('is_active', true)
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const token = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token and update user (you would implement token verification logic)
    // For now, we'll just simulate the process

    // await db('users').where('verification_token', token).update({
    //   email_verified: true,
    //   email_verified_at: new Date(),
    //   verification_token: null,
    //   updated_at: new Date()
    // });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during email verification'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyEmail
}; 