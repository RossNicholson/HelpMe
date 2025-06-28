const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const knex = require('../utils/database');

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get('/', protect, async (req, res) => {
  try {
    const clients = await knex('clients')
      .where('organization_id', req.user.organization_id)
      .orderBy('name');
    
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch clients' 
    });
  }
});

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
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
 *         description: Client details
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const client = await knex('clients')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .first();
    
    if (!client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch client' 
    });
  }
});

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *     responses:
 *       201:
 *         description: Client created successfully
 */
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'Name and email are required' 
      });
    }
    
    const [client] = await knex('clients').insert({
      name,
      email,
      phone,
      address,
      notes,
      organization_id: req.user.organization_id
    }).returning('*');
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to create client' 
    });
  }
});

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update client
 *     tags: [Clients]
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
 *         description: Client updated successfully
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    const [client] = await knex('clients')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .update({ name, email, phone, address, notes })
      .returning('*');
    
    if (!client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to update client' 
    });
  }
});

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete client
 *     tags: [Clients]
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
 *         description: Client deleted successfully
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await knex('clients')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Client deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete client' 
    });
  }
});

module.exports = router; 