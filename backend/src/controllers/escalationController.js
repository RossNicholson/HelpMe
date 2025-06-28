const db = require('../utils/database');
const escalationService = require('../services/escalationService');
const logger = require('../utils/logger');

class EscalationController {
  /**
   * Get all escalation rules for an organization
   */
  async getEscalationRules(req, res) {
    try {
      const { organizationId } = req.params;
      const { is_active } = req.query;

      let query = db('escalation_rules')
        .where('organization_id', organizationId);

      if (is_active !== undefined) {
        query = query.where('is_active', is_active === 'true');
      }

      const escalationRules = await query.orderBy('created_at', 'desc');

      res.json({
        success: true,
        data: escalationRules
      });
    } catch (error) {
      logger.error('Error getting escalation rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get escalation rules',
        error: error.message
      });
    }
  }

  /**
   * Get a specific escalation rule
   */
  async getEscalationRule(req, res) {
    try {
      const { id } = req.params;

      const escalationRule = await db('escalation_rules')
        .where('id', id)
        .first();

      if (!escalationRule) {
        return res.status(404).json({
          success: false,
          message: 'Escalation rule not found'
        });
      }

      res.json({
        success: true,
        data: escalationRule
      });
    } catch (error) {
      logger.error('Error getting escalation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get escalation rule',
        error: error.message
      });
    }
  }

  /**
   * Create a new escalation rule
   */
  async createEscalationRule(req, res) {
    try {
      const {
        organization_id,
        name,
        description,
        trigger_type,
        trigger_hours,
        trigger_priority,
        trigger_status,
        action_type,
        target_user_id,
        target_role_id,
        new_priority,
        notification_recipients
      } = req.body;

      // Validate required fields
      if (!organization_id || !name || !trigger_type || !action_type) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate trigger type specific fields
      if (trigger_type === 'time_based' && !trigger_hours) {
        return res.status(400).json({
          success: false,
          message: 'trigger_hours is required for time_based triggers'
        });
      }

      if (trigger_type === 'priority_change' && !trigger_priority) {
        return res.status(400).json({
          success: false,
          message: 'trigger_priority is required for priority_change triggers'
        });
      }

      if (trigger_type === 'status_change' && !trigger_status) {
        return res.status(400).json({
          success: false,
          message: 'trigger_status is required for status_change triggers'
        });
      }

      const [escalationRule] = await db('escalation_rules')
        .insert({
          organization_id,
          name,
          description,
          trigger_type,
          trigger_hours,
          trigger_priority,
          trigger_status,
          action_type,
          target_user_id,
          target_role_id,
          new_priority,
          notification_recipients: notification_recipients || []
        })
        .returning('*');

      res.status(201).json({
        success: true,
        data: escalationRule
      });
    } catch (error) {
      logger.error('Error creating escalation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create escalation rule',
        error: error.message
      });
    }
  }

  /**
   * Update an escalation rule
   */
  async updateEscalationRule(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [updatedRule] = await db('escalation_rules')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      if (!updatedRule) {
        return res.status(404).json({
          success: false,
          message: 'Escalation rule not found'
        });
      }

      res.json({
        success: true,
        data: updatedRule
      });
    } catch (error) {
      logger.error('Error updating escalation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update escalation rule',
        error: error.message
      });
    }
  }

  /**
   * Delete an escalation rule
   */
  async deleteEscalationRule(req, res) {
    try {
      const { id } = req.params;

      const deleted = await db('escalation_rules')
        .where('id', id)
        .del();

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Escalation rule not found'
        });
      }

      res.json({
        success: true,
        message: 'Escalation rule deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting escalation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete escalation rule',
        error: error.message
      });
    }
  }

  /**
   * Check escalation rules for a specific ticket
   */
  async checkTicketEscalation(req, res) {
    try {
      const { ticketId } = req.params;

      const executedRules = await escalationService.checkEscalationRules(ticketId);

      res.json({
        success: true,
        data: {
          ticket_id: ticketId,
          executed_rules: executedRules,
          count: executedRules.length
        }
      });
    } catch (error) {
      logger.error('Error checking ticket escalation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check escalation rules',
        error: error.message
      });
    }
  }

  /**
   * Get escalation statistics for an organization
   */
  async getEscalationStats(req, res) {
    try {
      const { organizationId } = req.params;
      const { start_date, end_date } = req.query;

      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = end_date ? new Date(end_date) : new Date();

      const stats = await escalationService.getEscalationStats(organizationId, startDate, endDate);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting escalation stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get escalation stats',
        error: error.message
      });
    }
  }

  /**
   * Get available users and roles for escalation targets
   */
  async getEscalationTargets(req, res) {
    try {
      const { organizationId } = req.params;

      // Get users in the organization
      const users = await db('users')
        .join('user_organizations', 'users.id', 'user_organizations.user_id')
        .where('user_organizations.organization_id', organizationId)
        .select('users.id', 'users.first_name', 'users.last_name', 'users.email');

      // Get roles in the organization
      const roles = await db('roles')
        .where('organization_id', organizationId)
        .where('is_active', true)
        .select('id', 'name', 'description');

      res.json({
        success: true,
        data: {
          users,
          roles
        }
      });
    } catch (error) {
      logger.error('Error getting escalation targets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get escalation targets',
        error: error.message
      });
    }
  }

  /**
   * Test an escalation rule
   */
  async testEscalationRule(req, res) {
    try {
      const { ruleId } = req.params;
      const { ticketId } = req.body;

      if (!ticketId) {
        return res.status(400).json({
          success: false,
          message: 'ticketId is required'
        });
      }

      const rule = await db('escalation_rules')
        .where('id', ruleId)
        .first();

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Escalation rule not found'
        });
      }

      const ticket = await db('tickets')
        .where('id', ticketId)
        .first();

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      const shouldExecute = await escalationService.shouldExecuteRule(rule, ticket);

      res.json({
        success: true,
        data: {
          rule,
          ticket,
          should_execute: shouldExecute,
          test_result: shouldExecute ? 'Rule would execute' : 'Rule would not execute'
        }
      });
    } catch (error) {
      logger.error('Error testing escalation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test escalation rule',
        error: error.message
      });
    }
  }
}

module.exports = new EscalationController(); 