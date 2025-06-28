const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../utils/database');
const logger = require('../utils/logger');

class ClientPortalService {
  // Client Authentication
  async authenticateClient(email, password) {
    try {
      const client = await db('clients')
        .where('email', email)
        .where('active', true)
        .first();

      if (!client) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, client.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Create session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db('client_sessions').insert({
        client_id: client.id,
        session_token: sessionToken,
        expires_at: expiresAt,
        ip_address: null, // Will be set by middleware
        user_agent: null  // Will be set by middleware
      });

      return {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          organization_id: client.organization_id
        },
        sessionToken,
        expiresAt
      };
    } catch (error) {
      logger.error('Client authentication error:', error);
      throw error;
    }
  }

  // Session Management
  async validateSession(sessionToken) {
    try {
      const session = await db('client_sessions')
        .where('session_token', sessionToken)
        .where('expires_at', '>', new Date())
        .first();

      if (!session) {
        return null;
      }

      const client = await db('clients')
        .where('id', session.client_id)
        .where('active', true)
        .first();

      if (!client) {
        return null;
      }

      return {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          organization_id: client.organization_id
        },
        session
      };
    } catch (error) {
      logger.error('Session validation error:', error);
      return null;
    }
  }

  async logoutClient(sessionToken) {
    try {
      await db('client_sessions')
        .where('session_token', sessionToken)
        .del();
      
      return true;
    } catch (error) {
      logger.error('Client logout error:', error);
      throw error;
    }
  }

  // Portal Settings
  async getPortalSettings(organizationId) {
    try {
      let settings = await db('client_portal_settings')
        .where('organization_id', organizationId)
        .first();

      if (!settings) {
        // Create default settings
        settings = await this.createDefaultSettings(organizationId);
      }

      return settings;
    } catch (error) {
      logger.error('Get portal settings error:', error);
      throw error;
    }
  }

  async updatePortalSettings(organizationId, settings) {
    try {
      const existing = await db('client_portal_settings')
        .where('organization_id', organizationId)
        .first();

      if (existing) {
        await db('client_portal_settings')
          .where('organization_id', organizationId)
          .update({
            ...settings,
            updated_at: new Date()
          });
      } else {
        await db('client_portal_settings').insert({
          organization_id: organizationId,
          ...settings
        });
      }

      return await this.getPortalSettings(organizationId);
    } catch (error) {
      logger.error('Update portal settings error:', error);
      throw error;
    }
  }

  // Client Dashboard Data
  async getClientDashboard(clientId) {
    try {
      const [tickets, notifications, assets] = await Promise.all([
        this.getClientTickets(clientId),
        this.getClientNotifications(clientId),
        this.getClientAssets(clientId)
      ]);

      return {
        tickets,
        notifications,
        assets,
        summary: {
          totalTickets: tickets.length,
          openTickets: tickets.filter(t => t.status !== 'resolved').length,
          unreadNotifications: notifications.filter(n => !n.read).length,
          totalAssets: assets.length
        }
      };
    } catch (error) {
      logger.error('Get client dashboard error:', error);
      throw error;
    }
  }

  // Client Tickets
  async getClientTickets(clientId, filters = {}) {
    try {
      let query = db('tickets')
        .where('client_id', clientId)
        .orderBy('created_at', 'desc');

      if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.priority) {
        query = query.where('priority', filters.priority);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const tickets = await query;

      // Get comments count for each ticket
      const ticketsWithComments = await Promise.all(
        tickets.map(async (ticket) => {
          const commentsCount = await db('ticket_comments')
            .where('ticket_id', ticket.id)
            .count('* as count')
            .first();

          return {
            ...ticket,
            comments_count: parseInt(commentsCount.count)
          };
        })
      );

      return ticketsWithComments;
    } catch (error) {
      logger.error('Get client tickets error:', error);
      throw error;
    }
  }

  async getClientTicket(clientId, ticketId) {
    try {
      const ticket = await db('tickets')
        .where('id', ticketId)
        .where('client_id', clientId)
        .first();

      if (!ticket) {
        return null;
      }

      // Get comments for the ticket
      const comments = await db('ticket_comments')
        .where('ticket_id', ticketId)
        .orderBy('created_at', 'asc');

      return {
        ...ticket,
        comments
      };
    } catch (error) {
      logger.error('Get client ticket error:', error);
      throw error;
    }
  }

  async createClientTicket(clientId, ticketData) {
    try {
      const portalSettings = await this.getPortalSettings(ticketData.organization_id);
      
      if (!portalSettings.allow_ticket_creation) {
        throw new Error('Ticket creation is disabled for this organization');
      }

      const ticket = {
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority || 'medium',
        status: portalSettings.require_approval_for_tickets ? 'pending_approval' : 'open',
        client_id: clientId,
        organization_id: ticketData.organization_id,
        category: ticketData.category,
        custom_fields: ticketData.custom_fields || {}
      };

      const [ticketId] = await db('tickets').insert(ticket).returning('id');

      // Create notification for client
      await this.createClientNotification(clientId, ticketId, 'ticket_created', {
        title: 'Ticket Created',
        message: `Your ticket "${ticket.title}" has been created successfully.`
      });

      return await db('tickets').where('id', ticketId).first();
    } catch (error) {
      logger.error('Create client ticket error:', error);
      throw error;
    }
  }

  async addTicketComment(clientId, ticketId, content) {
    try {
      // Verify ticket belongs to client
      const ticket = await db('tickets')
        .where('id', ticketId)
        .where('client_id', clientId)
        .first();

      if (!ticket) {
        throw new Error('Ticket not found or access denied');
      }

      const comment = {
        ticket_id: ticketId,
        user_id: null, // Client comments don't have user_id
        client_id: clientId,
        content,
        is_internal: false
      };

      const [commentId] = await db('ticket_comments')
        .insert(comment)
        .returning('*');

      // Create notification for staff
      await this.createStaffNotification(ticketId, 'client_comment', {
        title: 'New Client Comment',
        message: `Client added a comment to ticket #${ticketId}`
      });

      return commentId;
    } catch (error) {
      logger.error('Add ticket comment error:', error);
      throw error;
    }
  }

  // Client Notifications
  async getClientNotifications(clientId, filters = {}) {
    try {
      let query = db('client_notifications')
        .where('client_id', clientId)
        .orderBy('created_at', 'desc');

      if (filters.read !== undefined) {
        query = query.where('read', filters.read);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    } catch (error) {
      logger.error('Get client notifications error:', error);
      throw error;
    }
  }

  async createClientNotification(clientId, ticketId, type, data) {
    try {
      const notification = {
        client_id: clientId,
        ticket_id: ticketId,
        type,
        title: data.title,
        message: data.message
      };

      const [notificationId] = await db('client_notifications')
        .insert(notification)
        .returning('id');

      return await db('client_notifications').where('id', notificationId).first();
    } catch (error) {
      logger.error('Create client notification error:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId, clientId) {
    try {
      await db('client_notifications')
        .where('id', notificationId)
        .where('client_id', clientId)
        .update({
          read: true,
          read_at: new Date()
        });

      return true;
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Client Assets
  async getClientAssets(clientId) {
    try {
      return await db('assets')
        .where('client_id', clientId)
        .orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Get client assets error:', error);
      throw error;
    }
  }

  async getClientAsset(clientId, assetId) {
    try {
      return await db('assets')
        .where('id', assetId)
        .where('client_id', clientId)
        .first();
    } catch (error) {
      logger.error('Get client asset error:', error);
      throw error;
    }
  }

  // Knowledge Base Access
  async getKnowledgeBaseArticles(organizationId, filters = {}) {
    try {
      let query = db('knowledge_base')
        .where('organization_id', organizationId)
        .where('published', true)
        .orderBy('created_at', 'desc');

      if (filters.category) {
        query = query.where('category', filters.category);
      }

      if (filters.search) {
        query = query.where(function() {
          this.where('title', 'ilike', `%${filters.search}%`)
            .orWhere('content', 'ilike', `%${filters.search}%`);
        });
      }

      return await query;
    } catch (error) {
      logger.error('Get knowledge base articles error:', error);
      throw error;
    }
  }

  async getKnowledgeBaseArticle(organizationId, articleId) {
    try {
      return await db('knowledge_base')
        .where('id', articleId)
        .where('organization_id', organizationId)
        .where('published', true)
        .first();
    } catch (error) {
      logger.error('Get knowledge base article error:', error);
      throw error;
    }
  }

  // Utility Methods
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async createDefaultSettings(organizationId) {
    const defaultSettings = {
      organization_id: organizationId,
      enabled: true,
      primary_color: '#3B82F6',
      secondary_color: '#1F2937',
      allow_ticket_creation: true,
      allow_knowledge_base_access: true,
      allow_asset_viewing: true,
      require_approval_for_tickets: false
    };

    const [settingsId] = await db('client_portal_settings')
      .insert(defaultSettings)
      .returning('*');

    return settingsId;
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      await db('client_sessions')
        .where('expires_at', '<', new Date())
        .del();
    } catch (error) {
      logger.error('Cleanup expired sessions error:', error);
    }
  }

  // Profile Management
  async updateClientProfile(clientId, updates) {
    try {
      const allowedUpdates = ['name', 'phone', 'address'];
      const filteredUpdates = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error('No valid fields to update');
      }

      await db('clients')
        .where('id', clientId)
        .update({
          ...filteredUpdates,
          updated_at: new Date()
        });

      return await db('clients').where('id', clientId).first();
    } catch (error) {
      logger.error('Update client profile error:', error);
      throw error;
    }
  }

  // Session Management
  async updateSessionInfo(sessionToken, info) {
    try {
      await db('client_sessions')
        .where('session_token', sessionToken)
        .update({
          ip_address: info.ip_address,
          user_agent: info.user_agent,
          updated_at: new Date()
        });
    } catch (error) {
      logger.error('Update session info error:', error);
      throw error;
    }
  }

  // Staff Notifications (for when clients interact)
  async createStaffNotification(ticketId, type, data) {
    try {
      // This would typically notify staff members about client activity
      // Implementation depends on your notification system
      logger.info(`Staff notification: ${type} for ticket ${ticketId}`, data);
    } catch (error) {
      logger.error('Create staff notification error:', error);
    }
  }
}

module.exports = new ClientPortalService(); 