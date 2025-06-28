const db = require('../utils/database');
const logger = require('../utils/logger');

// SMS Provider Classes
class TwilioProvider {
  constructor(config) {
    this.accountSid = config.account_sid;
    this.authToken = config.auth_token;
    this.fromNumber = config.from_number;
    this.client = null;
    
    if (this.accountSid && this.authToken) {
      try {
        this.client = require('twilio')(this.accountSid, this.authToken);
      } catch (error) {
        logger.error('Failed to initialize Twilio client:', error);
      }
    }
  }

  async sendSMS(to, message) {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        response: result
      };
    } catch (error) {
      logger.error('Twilio SMS send error:', error);
      return {
        success: false,
        error: error.message,
        response: error
      };
    }
  }

  async checkDeliveryStatus(messageId) {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        status: message.status,
        delivered: message.status === 'delivered'
      };
    } catch (error) {
      logger.error('Twilio status check error:', error);
      return {
        status: 'unknown',
        delivered: false,
        error: error.message
      };
    }
  }
}

class AWSSNSProvider {
  constructor(config) {
    this.region = config.region || 'us-east-1';
    this.accessKeyId = config.access_key_id;
    this.secretAccessKey = config.secret_access_key;
    this.fromNumber = config.from_number;
    this.client = null;

    if (this.accessKeyId && this.secretAccessKey) {
      try {
        const AWS = require('aws-sdk');
        this.client = new AWS.SNS({
          region: this.region,
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey
        });
      } catch (error) {
        logger.error('Failed to initialize AWS SNS client:', error);
      }
    }
  }

  async sendSMS(to, message) {
    if (!this.client) {
      throw new Error('AWS SNS client not initialized');
    }

    try {
      const params = {
        Message: message,
        PhoneNumber: to,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      };

      const result = await this.client.publish(params).promise();

      return {
        success: true,
        messageId: result.MessageId,
        status: 'sent',
        response: result
      };
    } catch (error) {
      logger.error('AWS SNS SMS send error:', error);
      return {
        success: false,
        error: error.message,
        response: error
      };
    }
  }

  async checkDeliveryStatus(messageId) {
    // AWS SNS doesn't provide delivery status for SMS
    // We'll assume delivered after a certain time
    return {
      status: 'delivered',
      delivered: true
    };
  }
}

class SMSService {
  constructor() {
    this.providers = {
      twilio: TwilioProvider,
      aws_sns: AWSSNSProvider
    };
  }

  // Get SMS settings for organization
  async getSMSSettings(organizationId) {
    try {
      let settings = await db('sms_settings')
        .where('organization_id', organizationId)
        .first();

      if (!settings) {
        // Create default settings
        settings = await this.createDefaultSettings(organizationId);
      }

      return settings;
    } catch (error) {
      logger.error('Get SMS settings error:', error);
      throw error;
    }
  }

  // Update SMS settings
  async updateSMSSettings(organizationId, settings) {
    try {
      const existing = await db('sms_settings')
        .where('organization_id', organizationId)
        .first();

      if (existing) {
        await db('sms_settings')
          .where('organization_id', organizationId)
          .update({
            ...settings,
            updated_at: new Date()
          });
      } else {
        await db('sms_settings').insert({
          organization_id: organizationId,
          ...settings
        });
      }

      return await this.getSMSSettings(organizationId);
    } catch (error) {
      logger.error('Update SMS settings error:', error);
      throw error;
    }
  }

  // Get SMS templates
  async getSMSTemplates(organizationId, type = null) {
    try {
      let query = db('sms_templates')
        .where('organization_id', organizationId)
        .where('active', true);

      if (type) {
        query = query.where('type', type);
      }

      return await query.orderBy('name');
    } catch (error) {
      logger.error('Get SMS templates error:', error);
      throw error;
    }
  }

  // Create or update SMS template
  async saveSMSTemplate(organizationId, templateData) {
    try {
      if (templateData.id) {
        await db('sms_templates')
          .where('id', templateData.id)
          .where('organization_id', organizationId)
          .update({
            ...templateData,
            updated_at: new Date()
          });
      } else {
        const [templateId] = await db('sms_templates')
          .insert({
            organization_id: organizationId,
            ...templateData
          })
          .returning('id');
        
        templateData.id = templateId;
      }

      return templateData;
    } catch (error) {
      logger.error('Save SMS template error:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSMS(organizationId, toNumber, message, options = {}) {
    try {
      const settings = await this.getSMSSettings(organizationId);
      
      if (!settings.enabled) {
        throw new Error('SMS notifications are disabled for this organization');
      }

      const ProviderClass = this.providers[settings.provider];
      if (!ProviderClass) {
        throw new Error(`Unsupported SMS provider: ${settings.provider}`);
      }

      const provider = new ProviderClass(settings);
      const result = await provider.sendSMS(toNumber, message);

      // Log the SMS notification
      const [notificationId] = await db('sms_notifications').insert({
        organization_id: organizationId,
        user_id: options.userId,
        client_id: options.clientId,
        ticket_id: options.ticketId,
        to_number: toNumber,
        from_number: settings.from_number,
        message,
        status: result.success ? 'sent' : 'failed',
        provider_message_id: result.messageId,
        provider_response: result.response,
        sent_at: result.success ? new Date() : null,
        error_message: result.error
      }).returning('id');

      if (!result.success) {
        // Schedule retry if needed
        await this.scheduleRetry(notificationId, settings);
      }

      return {
        success: result.success,
        notificationId,
        messageId: result.messageId,
        error: result.error
      };
    } catch (error) {
      logger.error('Send SMS error:', error);
      throw error;
    }
  }

  // Send SMS using template
  async sendSMSTemplate(organizationId, toNumber, templateType, variables, options = {}) {
    try {
      const templates = await this.getSMSTemplates(organizationId, templateType);
      const template = templates[0];

      if (!template) {
        throw new Error(`No SMS template found for type: ${templateType}`);
      }

      let message = template.template;
      
      // Replace variables in template
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
      }

      return await this.sendSMS(organizationId, toNumber, message, options);
    } catch (error) {
      logger.error('Send SMS template error:', error);
      throw error;
    }
  }

  // Check delivery status
  async checkDeliveryStatus(notificationId) {
    try {
      const notification = await db('sms_notifications')
        .where('id', notificationId)
        .first();

      if (!notification || !notification.provider_message_id) {
        throw new Error('Notification not found or no provider message ID');
      }

      const settings = await this.getSMSSettings(notification.organization_id);
      const ProviderClass = this.providers[settings.provider];
      const provider = new ProviderClass(settings);

      const status = await provider.checkDeliveryStatus(notification.provider_message_id);

      // Update notification status
      await db('sms_notifications')
        .where('id', notificationId)
        .update({
          status: status.status,
          delivered_at: status.delivered ? new Date() : null,
          updated_at: new Date()
        });

      return status;
    } catch (error) {
      logger.error('Check delivery status error:', error);
      throw error;
    }
  }

  // Schedule retry for failed SMS
  async scheduleRetry(notificationId, settings) {
    try {
      const notification = await db('sms_notifications')
        .where('id', notificationId)
        .first();

      if (!notification) return;

      const maxRetries = 3;
      const retryDelay = 5 * 60 * 1000; // 5 minutes

      if (notification.retry_count < maxRetries) {
        const nextRetry = new Date(Date.now() + retryDelay);
        
        await db('sms_notifications')
          .where('id', notificationId)
          .update({
            retry_count: notification.retry_count + 1,
            next_retry_at: nextRetry,
            status: 'pending'
          });
      }
    } catch (error) {
      logger.error('Schedule retry error:', error);
    }
  }

  // Get user SMS preferences
  async getUserSMSPreferences(userId) {
    try {
      return await db('user_sms_preferences')
        .where('user_id', userId)
        .where('enabled', true);
    } catch (error) {
      logger.error('Get user SMS preferences error:', error);
      throw error;
    }
  }

  // Get client SMS preferences
  async getClientSMSPreferences(clientId) {
    try {
      return await db('client_sms_preferences')
        .where('client_id', clientId)
        .where('enabled', true);
    } catch (error) {
      logger.error('Get client SMS preferences error:', error);
      throw error;
    }
  }

  // Save user SMS preferences
  async saveUserSMSPreferences(userId, preferences) {
    try {
      const existing = await db('user_sms_preferences')
        .where('user_id', userId)
        .where('phone_number', preferences.phone_number)
        .first();

      if (existing) {
        await db('user_sms_preferences')
          .where('id', existing.id)
          .update({
            ...preferences,
            updated_at: new Date()
          });
      } else {
        await db('user_sms_preferences').insert({
          user_id: userId,
          ...preferences
        });
      }
    } catch (error) {
      logger.error('Save user SMS preferences error:', error);
      throw error;
    }
  }

  // Save client SMS preferences
  async saveClientSMSPreferences(clientId, preferences) {
    try {
      const existing = await db('client_sms_preferences')
        .where('client_id', clientId)
        .where('phone_number', preferences.phone_number)
        .first();

      if (existing) {
        await db('client_sms_preferences')
          .where('id', existing.id)
          .update({
            ...preferences,
            updated_at: new Date()
          });
      } else {
        await db('client_sms_preferences').insert({
          client_id: clientId,
          ...preferences
        });
      }
    } catch (error) {
      logger.error('Save client SMS preferences error:', error);
      throw error;
    }
  }

  // Utility methods
  async createDefaultSettings(organizationId) {
    const defaultSettings = {
      organization_id: organizationId,
      provider: 'twilio',
      enabled: false
    };

    const [settingsId] = await db('sms_settings')
      .insert(defaultSettings)
      .returning('*');

    return settingsId;
  }

  // Process retry queue
  async processRetryQueue() {
    try {
      const pendingRetries = await db('sms_notifications')
        .where('status', 'pending')
        .where('retry_count', '>', 0)
        .where('next_retry_at', '<=', new Date())
        .limit(10);

      for (const notification of pendingRetries) {
        const settings = await this.getSMSSettings(notification.organization_id);
        const ProviderClass = this.providers[settings.provider];
        const provider = new ProviderClass(settings);

        const result = await provider.sendSMS(notification.to_number, notification.message);

        await db('sms_notifications')
          .where('id', notification.id)
          .update({
            status: result.success ? 'sent' : 'failed',
            provider_message_id: result.messageId,
            provider_response: result.response,
            sent_at: result.success ? new Date() : null,
            error_message: result.error,
            updated_at: new Date()
          });

        if (!result.success) {
          await this.scheduleRetry(notification.id, settings);
        }
      }
    } catch (error) {
      logger.error('Process retry queue error:', error);
    }
  }
}

module.exports = new SMSService(); 