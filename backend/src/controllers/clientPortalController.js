const clientPortalService = require('../services/clientPortalService');
const logger = require('../utils/logger');

class ClientPortalController {
  // Authentication
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const result = await clientPortalService.authenticateClient(email, password);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Client login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed'
      });
    }
  }

  async logout(req, res) {
    try {
      const sessionToken = req.headers['x-session-token'];
      
      if (sessionToken) {
        await clientPortalService.logoutClient(sessionToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Client logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Dashboard
  async getDashboard(req, res) {
    try {
      const { client } = req;
      const dashboard = await clientPortalService.getClientDashboard(client.id);
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Get client dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load dashboard'
      });
    }
  }

  // Tickets
  async getTickets(req, res) {
    try {
      const { client } = req;
      const filters = req.query;
      
      const tickets = await clientPortalService.getClientTickets(client.id, filters);
      
      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      logger.error('Get client tickets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load tickets'
      });
    }
  }

  async getTicket(req, res) {
    try {
      const { client } = req;
      const { id } = req.params;

      const ticket = await clientPortalService.getClientTicket(client.id, id);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Get client ticket error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load ticket'
      });
    }
  }

  async createTicket(req, res) {
    try {
      const { client } = req;
      const ticketData = {
        ...req.body,
        organization_id: client.organization_id
      };

      const ticket = await clientPortalService.createClientTicket(client.id, ticketData);
      
      res.status(201).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Create client ticket error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create ticket'
      });
    }
  }

  async addTicketComment(req, res) {
    try {
      const { client } = req;
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      const comment = await clientPortalService.addTicketComment(client.id, id, content);
      
      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      logger.error('Add ticket comment error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add comment'
      });
    }
  }

  // Notifications
  async getNotifications(req, res) {
    try {
      const { client } = req;
      const filters = req.query;
      
      const notifications = await clientPortalService.getClientNotifications(client.id, filters);
      
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      logger.error('Get client notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load notifications'
      });
    }
  }

  async markNotificationAsRead(req, res) {
    try {
      const { client } = req;
      const { id } = req.params;

      await clientPortalService.markNotificationAsRead(id, client.id);
      
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }

  // Assets
  async getAssets(req, res) {
    try {
      const { client } = req;
      
      const assets = await clientPortalService.getClientAssets(client.id);
      
      res.json({
        success: true,
        data: assets
      });
    } catch (error) {
      logger.error('Get client assets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load assets'
      });
    }
  }

  async getAsset(req, res) {
    try {
      const { client } = req;
      const { id } = req.params;

      const asset = await clientPortalService.getClientAsset(client.id, id);
      
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }

      res.json({
        success: true,
        data: asset
      });
    } catch (error) {
      logger.error('Get client asset error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load asset'
      });
    }
  }

  // Knowledge Base
  async getKnowledgeBase(req, res) {
    try {
      const { client } = req;
      const filters = req.query;
      
      const articles = await clientPortalService.getKnowledgeBaseArticles(client.organization_id, filters);
      
      res.json({
        success: true,
        data: articles
      });
    } catch (error) {
      logger.error('Get knowledge base error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load knowledge base'
      });
    }
  }

  async getKnowledgeBaseArticle(req, res) {
    try {
      const { client } = req;
      const { id } = req.params;

      const article = await clientPortalService.getKnowledgeBaseArticle(client.organization_id, id);
      
      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      res.json({
        success: true,
        data: article
      });
    } catch (error) {
      logger.error('Get knowledge base article error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load article'
      });
    }
  }

  // Portal Settings (for organization admins)
  async getPortalSettings(req, res) {
    try {
      const { organization_id } = req.params;
      
      const settings = await clientPortalService.getPortalSettings(organization_id);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Get portal settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load portal settings'
      });
    }
  }

  async updatePortalSettings(req, res) {
    try {
      const { organization_id } = req.params;
      const settings = req.body;
      
      const updatedSettings = await clientPortalService.updatePortalSettings(organization_id, settings);
      
      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      logger.error('Update portal settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update portal settings'
      });
    }
  }

  // Profile
  async getProfile(req, res) {
    try {
      const { client } = req;
      
      res.json({
        success: true,
        data: {
          id: client.id,
          name: client.name,
          email: client.email,
          organization_id: client.organization_id
        }
      });
    } catch (error) {
      logger.error('Get client profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load profile'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { client } = req;
      const updates = req.body;
      
      const updatedProfile = await clientPortalService.updateClientProfile(client.id, updates);
      
      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      logger.error('Update client profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }
}

module.exports = new ClientPortalController(); 