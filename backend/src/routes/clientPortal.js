const express = require('express');
const router = express.Router();
const clientPortalController = require('../controllers/clientPortalController');
const { clientAuth, optionalClientAuth, checkPortalEnabled } = require('../middleware/clientAuth');

// Public routes (no authentication required)
router.post('/login', clientPortalController.login);
router.post('/logout', clientPortalController.logout);

// Portal settings (public access for checking if portal is enabled)
router.get('/organizations/:organization_id/settings', 
  checkPortalEnabled, 
  clientPortalController.getPortalSettings
);

// Protected routes (require client authentication)
router.use(clientAuth);

// Dashboard
router.get('/dashboard', clientPortalController.getDashboard);

// Tickets
router.get('/tickets', clientPortalController.getTickets);
router.get('/tickets/:id', clientPortalController.getTicket);
router.post('/tickets', clientPortalController.createTicket);
router.post('/tickets/:id/comments', clientPortalController.addTicketComment);

// Notifications
router.get('/notifications', clientPortalController.getNotifications);
router.put('/notifications/:id/read', clientPortalController.markNotificationAsRead);

// Assets
router.get('/assets', clientPortalController.getAssets);
router.get('/assets/:id', clientPortalController.getAsset);

// Knowledge Base
router.get('/knowledge-base', clientPortalController.getKnowledgeBase);
router.get('/knowledge-base/:id', clientPortalController.getKnowledgeBaseArticle);

// Profile
router.get('/profile', clientPortalController.getProfile);
router.put('/profile', clientPortalController.updateProfile);

// Organization admin routes (for managing portal settings)
router.put('/organizations/:organization_id/settings', 
  clientPortalController.updatePortalSettings
);

module.exports = router; 