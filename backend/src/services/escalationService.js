const knex = require('../utils/database');
const logger = require('../utils/logger');
const emailService = require('./emailService');

class EscalationService {
  /**
   * Check and execute escalation rules for a ticket
   */
  async checkEscalationRules(ticketId) {
    try {
      const ticket = await knex('tickets')
        .where('id', ticketId)
        .first();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const escalationRules = await knex('escalation_rules')
        .where({
          organization_id: ticket.organization_id,
          is_active: true
        });

      const executedRules = [];

      for (const rule of escalationRules) {
        const shouldExecute = await this.shouldExecuteRule(rule, ticket);
        
        if (shouldExecute) {
          await this.executeEscalationRule(rule, ticket);
          executedRules.push(rule);
        }
      }

      return executedRules;
    } catch (error) {
      logger.error('Error checking escalation rules:', error);
      throw error;
    }
  }

  /**
   * Determine if an escalation rule should be executed
   */
  async shouldExecuteRule(rule, ticket) {
    const now = new Date();
    const ticketAge = Math.floor((now - new Date(ticket.created_at)) / (1000 * 60 * 60)); // Hours

    switch (rule.trigger_type) {
      case 'time_based':
        return ticketAge >= rule.trigger_hours;

      case 'priority_change':
        return ticket.priority === rule.trigger_priority;

      case 'status_change':
        return ticket.status === rule.trigger_status;

      case 'manual':
        return false; // Manual escalations are triggered by user action

      default:
        return false;
    }
  }

  /**
   * Execute an escalation rule
   */
  async executeEscalationRule(rule, ticket) {
    try {
      switch (rule.action_type) {
        case 'notify_manager':
          await this.notifyManager(rule, ticket);
          break;

        case 'reassign_ticket':
          await this.reassignTicket(rule, ticket);
          break;

        case 'change_priority':
          await this.changePriority(rule, ticket);
          break;

        case 'notify_stakeholders':
          await this.notifyStakeholders(rule, ticket);
          break;

        default:
          logger.warn(`Unknown escalation action type: ${rule.action_type}`);
      }

      // Log the escalation
      await this.logEscalation(rule, ticket);
    } catch (error) {
      logger.error('Error executing escalation rule:', error);
      throw error;
    }
  }

  /**
   * Notify manager about escalated ticket
   */
  async notifyManager(rule, ticket) {
    try {
      const manager = await knex('users')
        .where('id', rule.target_user_id)
        .first();

      if (manager) {
        await emailService.sendEscalationNotification({
          to: manager.email,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          escalationRule: rule.name,
          ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        });
      }
    } catch (error) {
      logger.error('Error notifying manager:', error);
      throw error;
    }
  }

  /**
   * Reassign ticket to different user or role
   */
  async reassignTicket(rule, ticket) {
    try {
      let newAssigneeId = null;

      if (rule.target_user_id) {
        newAssigneeId = rule.target_user_id;
      } else if (rule.target_role_id) {
        // Find a user with the specified role
        const userWithRole = await knex('user_organizations')
          .where({
            organization_id: ticket.organization_id,
            role_id: rule.target_role_id
          })
          .first();
        
        if (userWithRole) {
          newAssigneeId = userWithRole.user_id;
        }
      }

      if (newAssigneeId && newAssigneeId !== ticket.assigned_to) {
        await knex('tickets')
          .where('id', ticket.id)
          .update({
            assigned_to: newAssigneeId,
            updated_at: new Date()
          });

        // Add a comment about the reassignment
        await knex('ticket_comments').insert({
          ticket_id: ticket.id,
          user_id: null, // System comment
          content: `Ticket escalated and reassigned due to rule: ${rule.name}`,
          is_internal: true,
          created_at: new Date()
        });
      }
    } catch (error) {
      logger.error('Error reassigning ticket:', error);
      throw error;
    }
  }

  /**
   * Change ticket priority
   */
  async changePriority(rule, ticket) {
    try {
      if (rule.new_priority && rule.new_priority !== ticket.priority) {
        await knex('tickets')
          .where('id', ticket.id)
          .update({
            priority: rule.new_priority,
            updated_at: new Date()
          });

        // Add a comment about the priority change
        await knex('ticket_comments').insert({
          ticket_id: ticket.id,
          user_id: null, // System comment
          content: `Priority changed from ${ticket.priority} to ${rule.new_priority} due to escalation rule: ${rule.name}`,
          is_internal: true,
          created_at: new Date()
        });
      }
    } catch (error) {
      logger.error('Error changing priority:', error);
      throw error;
    }
  }

  /**
   * Notify stakeholders about escalated ticket
   */
  async notifyStakeholders(rule, ticket) {
    try {
      const recipients = rule.notification_recipients || [];
      
      for (const email of recipients) {
        await emailService.sendEscalationNotification({
          to: email,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          priority: ticket.priority,
          escalationRule: rule.name,
          ticketUrl: `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
        });
      }
    } catch (error) {
      logger.error('Error notifying stakeholders:', error);
      throw error;
    }
  }

  /**
   * Log escalation action
   */
  async logEscalation(rule, ticket) {
    try {
      await knex('ticket_comments').insert({
        ticket_id: ticket.id,
        user_id: null, // System comment
        content: `Escalation rule "${rule.name}" executed: ${rule.action_type}`,
        is_internal: true,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Error logging escalation:', error);
      throw error;
    }
  }

  /**
   * Get escalation statistics for an organization
   */
  async getEscalationStats(organizationId, startDate, endDate) {
    try {
      const escalations = await knex('ticket_comments')
        .join('tickets', 'tickets.id', 'ticket_comments.ticket_id')
        .where('tickets.organization_id', organizationId)
        .where('ticket_comments.is_internal', true)
        .where('ticket_comments.content', 'like', '%Escalation rule%')
        .whereBetween('ticket_comments.created_at', [startDate, endDate])
        .select('ticket_comments.*', 'tickets.priority', 'tickets.status');

      return {
        totalEscalations: escalations.length,
        escalationsByPriority: escalations.reduce((acc, esc) => {
          acc[esc.priority] = (acc[esc.priority] || 0) + 1;
          return acc;
        }, {}),
        escalationsByStatus: escalations.reduce((acc, esc) => {
          acc[esc.status] = (acc[esc.status] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting escalation stats:', error);
      throw error;
    }
  }
}

module.exports = new EscalationService(); 