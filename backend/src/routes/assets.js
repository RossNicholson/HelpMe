const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../utils/database');

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assets
 */
router.get('/', protect, async (req, res) => {
  try {
    const assets = await db('assets')
      .where('organization_id', req.user.organization_id)
      .orderBy('name');
    
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Assets]
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
 *         description: Asset details
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await db('assets')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .first();
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Create a new asset
 *     tags: [Assets]
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
 *               - type
 *     responses:
 *       201:
 *         description: Asset created successfully
 */
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, description, serial_number, location, status, client_id } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const [asset] = await db('assets').insert({
      name,
      type,
      description,
      serial_number,
      location,
      status: status || 'active',
      client_id,
      organization_id: req.user.organization_id
    }).returning('*');
    
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     summary: Update asset
 *     tags: [Assets]
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
 *         description: Asset updated successfully
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, type, description, serial_number, location, status, client_id } = req.body;
    
    const [asset] = await db('assets')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .update({ name, type, description, serial_number, location, status, client_id })
      .returning('*');
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     tags: [Assets]
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
 *         description: Asset deleted successfully
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await db('assets')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

module.exports = router; 