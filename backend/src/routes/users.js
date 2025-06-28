const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const knex = require('../utils/database');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', protect, authorize(['admin']), async (req, res) => {
  try {
    const users = await knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'organization_id', 'created_at')
      .where('organization_id', req.user.organization_id);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users' 
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await knex('users')
      .select('id', 'email', 'first_name', 'last_name', 'role', 'organization_id', 'created_at')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
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
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - role
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/', protect, authorize(['admin']), async (req, res) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;
    
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }
    
    const bcrypt = require('bcrypt');
    
    // Check if user already exists
    const existingUser = await knex('users')
      .where({ email, organization_id: req.user.organization_id })
      .first();
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [user] = await knex('users').insert({
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      role,
      organization_id: req.user.organization_id
    }).returning(['id', 'email', 'first_name', 'last_name', 'role', 'created_at']);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to create user' 
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { first_name, last_name, role } = req.body;
    
    // Only allow admins to update other users, or users to update themselves
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions' 
      });
    }
    
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (role && req.user.role === 'admin') updateData.role = role;
    
    const [user] = await knex('users')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'created_at']);
    
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
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user' 
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete your own account' 
      });
    }
    
    const deleted = await knex('users')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user' 
    });
  }
});

module.exports = router; 