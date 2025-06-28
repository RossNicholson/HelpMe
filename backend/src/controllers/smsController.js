const smsService = require('../services/smsService');
const db = require('../utils/database');
const logger = require('../utils/logger');

class SMSController {
  // Get SMS settings
  async getSMSSettings(req, res) {
    try {
      const { organizationId } = req.user;
      const settings = await smsService.getSMSSettings(organizationId);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Get SMS settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SMS settings',
        error: error.message
      });
    }
  }

  // Update SMS settings
  async updateSMSSettings(req, res) {
    try {
      const { organizationId } = req.user;
      const settings = req.body;

      // Validate required fields
      if (settings.provider === 'twilio') {
        if (!settings.account_sid || !settings.auth_token || !settings.from_number) {
          return res.status(400).json({
            success: false,
            message: 'Twilio requires account SID, auth token, and from number'
          });
        }
      } else if (settings.provider === 'aws_sns') {
        if (!settings.access_key_id || !settings.secret_access_key || !settings.from_number) {
          return res.status(400).json({
            success: false,
            message: 'AWS SNS requires access key ID, secret access key, and from number'
          });
        }
      }

      const updatedSettings = await smsService.updateSMSSettings(organizationId, settings);
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'SMS settings updated successfully'
      });
    } catch (error) {
      logger.error('Update SMS settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update SMS settings',
        error: error.message
      });
    }
  }

  // Test SMS configuration
  async testSMSSettings(req, res) {
    try {
      const { organizationId } = req.user;
      const { test_number } = req.body;

      if (!test_number) {
        return res.status(400).json({
          success: false,
          message: 'Test phone number is required'
        });
      }

      const testMessage = 'This is a test SMS from HelpMe. If you receive this, your SMS configuration is working correctly.';
      
      const result = await smsService.sendSMS(organizationId, test_number, testMessage, {
        userId: req.user.id
      });

      res.json({
        success: result.success,
        message: result.success ? 'Test SMS sent successfully' : 'Failed to send test SMS',
        data: {
          notificationId: result.notificationId,
          messageId: result.messageId,
          error: result.error
        }
      });
    } catch (error) {
      logger.error('Test SMS settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test SMS',
        error: error.message
      });
    }
  }

  // Get SMS templates
  async getSMSTemplates(req, res) {
    try {
      const { organizationId } = req.user;
      const { type } = req.query;

      const templates = await smsService.getSMSTemplates(organizationId, type);
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      logger.error('Get SMS templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SMS templates',
        error: error.message
      });
    }
  }

  // Create or update SMS template
  async saveSMSTemplate(req, res) {
    try {
      const { organizationId } = req.user;
      const templateData = req.body;

      // Validate required fields
      if (!templateData.name || !templateData.type || !templateData.template) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and template are required'
        });
      }

      const template = await smsService.saveSMSTemplate(organizationId, templateData);
      
      res.json({
        success: true,
        data: template,
        message: templateData.id ? 'SMS template updated successfully' : 'SMS template created successfully'
      });
    } catch (error) {
      logger.error('Save SMS template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save SMS template',
        error: error.message
      });
    }
  }

  // Delete SMS template
  async deleteSMSTemplate(req, res) {
    try {
      const { organizationId } = req.user;
      const { templateId } = req.params;

      await smsService.saveSMSTemplate(organizationId, {
        id: templateId,
        active: false
      });
      
      res.json({
        success: true,
        message: 'SMS template deleted successfully'
      });
    } catch (error) {
      logger.error('Delete SMS template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete SMS template',
        error: error.message
      });
    }
  }

  // Send SMS notification
  async sendSMS(req, res) {
    try {
      const { organizationId } = req.user;
      const { to_number, message, ticket_id, client_id } = req.body;

      if (!to_number || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and message are required'
        });
      }

      const result = await smsService.sendSMS(organizationId, to_number, message, {
        userId: req.user.id,
        ticketId: ticket_id,
        clientId: client_id
      });

      res.json({
        success: result.success,
        message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
        data: {
          notificationId: result.notificationId,
          messageId: result.messageId,
          error: result.error
        }
      });
    } catch (error) {
      logger.error('Send SMS error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: error.message
      });
    }
  }

  // Send SMS using template
  async sendSMSTemplate(req, res) {
    try {
      const { organizationId } = req.user;
      const { to_number, template_type, variables, ticket_id, client_id } = req.body;

      if (!to_number || !template_type) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and template type are required'
        });
      }

      const result = await smsService.sendSMSTemplate(organizationId, to_number, template_type, variables || {}, {
        userId: req.user.id,
        ticketId: ticket_id,
        clientId: client_id
      });

      res.json({
        success: result.success,
        message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
        data: {
          notificationId: result.notificationId,
          messageId: result.messageId,
          error: result.error
        }
      });
    } catch (error) {
      logger.error('Send SMS template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: error.message
      });
    }
  }

  // Get SMS notifications
  async getSMSNotifications(req, res) {
    try {
      const { organizationId } = req.user;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = db('sms_notifications')
        .where('organization_id', organizationId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      if (status) {
        query = query.where('status', status);
      }

      const notifications = await query;

      // Get total count
      let countQuery = db('sms_notifications')
        .where('organization_id', organizationId);
      
      if (status) {
        countQuery = countQuery.where('status', status);
      }

      const total = await countQuery.count('* as count').first();

      res.json({
        success: true,
        data: notifications,
        pagination: {
          total: parseInt(total.count),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      logger.error('Get SMS notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SMS notifications',
        error: error.message
      });
    }
  }

  // Check delivery status
  async checkDeliveryStatus(req, res) {
    try {
      const { notificationId } = req.params;
      const { organizationId } = req.user;

      // Verify notification belongs to organization
      const notification = await db('sms_notifications')
        .where('id', notificationId)
        .where('organization_id', organizationId)
        .first();

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'SMS notification not found'
        });
      }

      const status = await smsService.checkDeliveryStatus(notificationId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Check delivery status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check delivery status',
        error: error.message
      });
    }
  }

  // Get user SMS preferences
  async getUserSMSPreferences(req, res) {
    try {
      const { id: userId } = req.user;
      const preferences = await smsService.getUserSMSPreferences(userId);
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      logger.error('Get user SMS preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SMS preferences',
        error: error.message
      });
    }
  }

  // Save user SMS preferences
  async saveUserSMSPreferences(req, res) {
    try {
      const { id: userId } = req.user;
      const preferences = req.body;

      if (!preferences.phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      await smsService.saveUserSMSPreferences(userId, preferences);
      
      res.json({
        success: true,
        message: 'SMS preferences saved successfully'
      });
    } catch (error) {
      logger.error('Save user SMS preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save SMS preferences',
        error: error.message
      });
    }
  }

  // Get client SMS preferences
  async getClientSMSPreferences(req, res) {
    try {
      const { clientId } = req.params;
      const { organizationId } = req.user;

      // Verify client belongs to organization
      const client = await db('clients')
        .where('id', clientId)
        .where('organization_id', organizationId)
        .first();

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      const preferences = await smsService.getClientSMSPreferences(clientId);
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      logger.error('Get client SMS preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get client SMS preferences',
        error: error.message
      });
    }
  }

  // Save client SMS preferences
  async saveClientSMSPreferences(req, res) {
    try {
      const { clientId } = req.params;
      const { organizationId } = req.user;
      const preferences = req.body;

      // Verify client belongs to organization
      const client = await db('clients')
        .where('id', clientId)
        .where('organization_id', organizationId)
        .first();

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      if (!preferences.phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      await smsService.saveClientSMSPreferences(clientId, preferences);
      
      res.json({
        success: true,
        message: 'Client SMS preferences saved successfully'
      });
    } catch (error) {
      logger.error('Save client SMS preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save client SMS preferences',
        error: error.message
      });
    }
  }

  // Get SMS statistics
  async getSMSStatistics(req, res) {
    try {
      const { organizationId } = req.user;
      const { start_date, end_date } = req.query;

      let query = db('sms_notifications')
        .where('organization_id', organizationId);

      if (start_date && end_date) {
        query = query.whereBetween('created_at', [start_date, end_date]);
      }

      const stats = await query
        .select('status')
        .count('* as count')
        .groupBy('status');

      const totalSent = await query.count('* as count').first();
      const successful = await query.where('status', 'sent').count('* as count').first();
      const failed = await query.where('status', 'failed').count('* as count').first();

      res.json({
        success: true,
        data: {
          total: parseInt(totalSent.count),
          successful: parseInt(successful.count),
          failed: parseInt(failed.count),
          byStatus: stats.reduce((acc, stat) => {
            acc[stat.status] = parseInt(stat.count);
            return acc;
          }, {})
        }
      });
    } catch (error) {
      logger.error('Get SMS statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SMS statistics',
        error: error.message
      });
    }
  }
}

module.exports = new SMSController(); 