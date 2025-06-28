const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const notifications = await db('notifications')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
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
 *         description: Notification details
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const notification = await db('notifications')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
router.put('/:id/read', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const [notification] = await db('notifications')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ read_at: new Date() })
      .returning('*');
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    
    await db('notifications')
      .where({ user_id: req.user.id, read_at: null })
      .update({ read_at: new Date() });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
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
 *         description: Notification deleted successfully
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const deleted = await db('notifications')
      .where({ id: req.params.id, user_id: req.user.id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router; 