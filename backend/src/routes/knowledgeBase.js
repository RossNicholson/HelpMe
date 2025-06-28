const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/knowledge-base:
 *   get:
 *     summary: Get all knowledge base articles
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of knowledge base articles
 */
router.get('/', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const articles = await db('knowledge_base')
      .where('organization_id', req.user.organization_id)
      .orderBy('title');
    
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch knowledge base articles' });
  }
});

/**
 * @swagger
 * /api/knowledge-base/{id}:
 *   get:
 *     summary: Get knowledge base article by ID
 *     tags: [Knowledge Base]
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
 *         description: Knowledge base article details
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const article = await db('knowledge_base')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .first();
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

/**
 * @swagger
 * /api/knowledge-base:
 *   post:
 *     summary: Create a new knowledge base article
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *     responses:
 *       201:
 *         description: Article created successfully
 */
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, category, tags, is_public } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const db = req.app.get('db');
    
    const [article] = await db('knowledge_base').insert({
      title,
      content,
      category,
      tags: tags ? JSON.stringify(tags) : null,
      is_public: is_public || false,
      organization_id: req.user.organization_id,
      created_by: req.user.id
    }).returning('*');
    
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create article' });
  }
});

/**
 * @swagger
 * /api/knowledge-base/{id}:
 *   put:
 *     summary: Update knowledge base article
 *     tags: [Knowledge Base]
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
 *         description: Article updated successfully
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, content, category, tags, is_public } = req.body;
    const db = req.app.get('db');
    
    const [article] = await db('knowledge_base')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .update({ 
        title, 
        content, 
        category, 
        tags: tags ? JSON.stringify(tags) : null,
        is_public,
        updated_at: new Date()
      })
      .returning('*');
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update article' });
  }
});

/**
 * @swagger
 * /api/knowledge-base/{id}:
 *   delete:
 *     summary: Delete knowledge base article
 *     tags: [Knowledge Base]
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
 *         description: Article deleted successfully
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const deleted = await db('knowledge_base')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

module.exports = router; 