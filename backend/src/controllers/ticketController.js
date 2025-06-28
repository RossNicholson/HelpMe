const knex = require('../utils/database');
const slaService = require('../services/slaService');
const escalationService = require('../services/escalationService');
const smsService = require('../services/smsService');
const logger = require('../utils/logger');

class TicketController {
  /**
   * Get all tickets for an organization
   */
  async getTickets(req, res) {
    try {
      const { organizationId } = req.params;
      const { 
        status, 
        priority, 
        assigned_to, 
        client_id,
        page = 1,
        limit = 20,
        search
      } = req.query;

      let query = knex('tickets')
        .join('clients', 'tickets.client_id', 'clients.id')
        .join('users as creator', 'tickets.created_by', 'creator.id')
        .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
        .where('tickets.organization_id', organizationId)
        .select(
          'tickets.*',
          'clients.name as client_name',
          'creator.first_name as creator_first_name',
          'creator.last_name as creator_last_name',
          'assignee.first_name as assignee_first_name',
          'assignee.last_name as assignee_last_name'
        );

      // Apply filters
      if (status) {
        query = query.where('tickets.status', status);
      }

      if (priority) {
        query = query.where('tickets.priority', priority);
      }

      if (assigned_to) {
        query = query.where('tickets.assigned_to', assigned_to);
      }

      if (client_id) {
        query = query.where('tickets.client_id', client_id);
      }

      if (search) {
        query = query.where(function() {
          this.where('tickets.subject', 'ilike', `%${search}%`)
            .orWhere('tickets.description', 'ilike', `%${search}%`)
            .orWhere('tickets.ticket_number', 'ilike', `%${search}%`);
        });
      }

      const offset = (page - 1) * limit;
      const tickets = await query
        .orderBy('tickets.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await knex('tickets')
        .where('organization_id', organizationId)
        .count('* as count')
        .first();

      res.json({
        success: true,
        data: tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      });
    } catch (error) {
      logger.error('Error getting tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tickets',
        error: error.message
      });
    }
  }

  /**
   * Get a specific ticket
   */
  async getTicket(req, res) {
    try {
      const { id } = req.params;

      const ticket = await knex('tickets')
        .join('clients', 'tickets.client_id', 'clients.id')
        .join('users as creator', 'tickets.created_by', 'creator.id')
        .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
        .where('tickets.id', id)
        .select(
          'tickets.*',
          'clients.name as client_name',
          'creator.first_name as creator_first_name',
          'creator.last_name as creator_last_name',
          'assignee.first_name as assignee_first_name',
          'assignee.last_name as assignee_last_name'
        )
        .first();

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Get ticket comments
      const comments = await knex('ticket_comments')
        .join('users', 'ticket_comments.user_id', 'users.id')
        .where('ticket_comments.ticket_id', id)
        .select(
          'ticket_comments.*',
          'users.first_name',
          'users.last_name',
          'users.email'
        )
        .orderBy('ticket_comments.created_at', 'asc');

      res.json({
        success: true,
        data: {
          ...ticket,
          comments
        }
      });
    } catch (error) {
      logger.error('Error getting ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ticket',
        error: error.message
      });
    }
  }

  /**
   * Create a new ticket
   */
  async createTicket(req, res) {
    try {
      const {
        organization_id,
        client_id,
        subject,
        description,
        priority = 'medium',
        type = 'incident',
        source = 'portal',
        assigned_to,
        tags = [],
        custom_fields = {}
      } = req.body;

      // Validate required fields
      if (!organization_id || !client_id || !subject || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Generate ticket number
      const ticketNumber = await this.generateTicketNumber(organization_id);

      // Calculate SLA due date
      const dueDate = await slaService.calculateSLADueDate(organization_id, priority, type);

      const [ticket] = await knex('tickets')
        .insert({
          organization_id,
          client_id,
          created_by: req.user.id,
          assigned_to,
          ticket_number: ticketNumber,
          subject,
          description,
          priority,
          type,
          source,
          due_date: dueDate,
          tags: JSON.stringify(tags),
          custom_fields: JSON.stringify(custom_fields)
        })
        .returning('*');

      // Check for SLA violations
      await slaService.checkSLAViolations(ticket.id);

      // Check for escalation rules
      await escalationService.checkEscalationRules(ticket.id);

      // Send SMS notifications
      try {
        await this.sendTicketSMSNotifications(ticket, 'ticket_created');
      } catch (smsError) {
        logger.error('Failed to send SMS notifications for ticket creation:', smsError);
        // Don't fail the ticket creation if SMS fails
      }

      res.status(201).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Error creating ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create ticket',
        error: error.message
      });
    }
  }

  /**
   * Update a ticket
   */
  async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Get current ticket
      const currentTicket = await knex('tickets')
        .where('id', id)
        .first();

      if (!currentTicket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // If priority or type changed, recalculate SLA
      if ((updateData.priority && updateData.priority !== currentTicket.priority) ||
          (updateData.type && updateData.type !== currentTicket.type)) {
        const dueDate = await slaService.calculateSLADueDate(
          currentTicket.organization_id,
          updateData.priority || currentTicket.priority,
          updateData.type || currentTicket.type
        );
        updateData.due_date = dueDate;
      }

      // If status changed to resolved, set resolved_at
      if (updateData.status === 'resolved' && currentTicket.status !== 'resolved') {
        updateData.resolved_at = new Date();
        // Resolve SLA violations
        await slaService.resolveSLAViolation(id, 'resolution_time');
      }

      // If first response is being made, set first_response_at
      if (updateData.status === 'in_progress' && currentTicket.status === 'open') {
        updateData.first_response_at = new Date();
        // Resolve response time SLA violations
        await slaService.resolveSLAViolation(id, 'response_time');
      }

      const [updatedTicket] = await knex('tickets')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      // Check for new SLA violations
      await slaService.checkSLAViolations(id);

      // Check for escalation rules
      await escalationService.checkEscalationRules(id);

      // Send SMS notifications
      try {
        await this.sendTicketSMSNotifications(updatedTicket, 'ticket_updated');
      } catch (smsError) {
        logger.error('Failed to send SMS notifications for ticket update:', smsError);
        // Don't fail the ticket update if SMS fails
      }

      res.json({
        success: true,
        data: updatedTicket
      });
    } catch (error) {
      logger.error('Error updating ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ticket',
        error: error.message
      });
    }
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(req, res) {
    try {
      const { ticketId } = req.params;
      const { content, is_internal = false } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      const [comment] = await knex('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: req.user.id,
          content,
          is_internal
        })
        .returning('*');

      // Update ticket's updated_at timestamp
      await knex('tickets')
        .where('id', ticketId)
        .update({ updated_at: new Date() });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      logger.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error.message
      });
    }
  }

  /**
   * Generate unique ticket number
   */
  async generateTicketNumber(organizationId) {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;
    
    const lastTicket = await knex('tickets')
      .where('organization_id', organizationId)
      .where('ticket_number', 'like', `${prefix}%`)
      .orderBy('ticket_number', 'desc')
      .first();

    let sequence = 1;
    if (lastTicket) {
      const lastNumber = parseInt(lastTicket.ticket_number.split('-')[2]);
      sequence = lastNumber + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Get ticket statistics for an organization
   */
  async getTicketStats(req, res) {
    try {
      const { organizationId } = req.params;
      const { start_date, end_date } = req.query;

      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();

      const stats = await knex('tickets')
        .where('organization_id', organizationId)
        .whereBetween('created_at', [startDate, endDate])
        .select('status', 'priority', 'type')
        .count('* as count')
        .groupBy('status', 'priority', 'type');

      const totalTickets = await knex('tickets')
        .where('organization_id', organizationId)
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      const resolvedTickets = await knex('tickets')
        .where('organization_id', organizationId)
        .whereBetween('resolved_at', [startDate, endDate])
        .count('* as count')
        .first();

      const avgResolutionTime = await knex('tickets')
        .where('organization_id', organizationId)
        .whereBetween('resolved_at', [startDate, endDate])
        .whereNotNull('resolved_at')
        .avg(knex.raw('EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 as avg_hours'))
        .first();

      res.json({
        success: true,
        data: {
          totalTickets: parseInt(totalTickets.count),
          resolvedTickets: parseInt(resolvedTickets.count),
          avgResolutionTime: parseFloat(avgResolutionTime.avg_hours || 0),
          stats: stats.reduce((acc, stat) => {
            const key = `${stat.status}_${stat.priority}_${stat.type}`;
            acc[key] = parseInt(stat.count);
            return acc;
          }, {})
        }
      });
    } catch (error) {
      logger.error('Error getting ticket stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ticket stats',
        error: error.message
      });
    }
  }

  /**
   * Send SMS notifications for ticket events
   */
  async sendTicketSMSNotifications(ticket, eventType) {
    try {
      // Get assigned user's SMS preferences
      if (ticket.assigned_to) {
        const userPreferences = await smsService.getUserSMSPreferences(ticket.assigned_to);
        
        for (const preference of userPreferences) {
          if (preference.notification_types && preference.notification_types.includes(eventType)) {
            const variables = {
              ticket_id: ticket.ticket_number,
              subject: ticket.subject,
              priority: ticket.priority,
              status: ticket.status,
              assigned_to: `${ticket.assignee_first_name || ''} ${ticket.assignee_last_name || ''}`.trim(),
              updated_by: `${ticket.creator_first_name || ''} ${ticket.creator_last_name || ''}`.trim()
            };

            await smsService.sendSMSTemplate(
              ticket.organization_id,
              preference.phone_number,
              eventType,
              variables,
              {
                userId: ticket.assigned_to,
                ticketId: ticket.id
              }
            );
          }
        }
      }

      // Get client's SMS preferences
      const clientPreferences = await smsService.getClientSMSPreferences(ticket.client_id);
      
      for (const preference of clientPreferences) {
        if (preference.notification_types && preference.notification_types.includes('client_ticket_update')) {
          const variables = {
            ticket_id: ticket.ticket_number,
            status: ticket.status,
            message: `Ticket updated by ${ticket.creator_first_name || ''} ${ticket.creator_last_name || ''}`.trim()
          };

          await smsService.sendSMSTemplate(
            ticket.organization_id,
            preference.phone_number,
            'client_ticket_update',
            variables,
            {
              clientId: ticket.client_id,
              ticketId: ticket.id
            }
          );
        }
      }
    } catch (error) {
      logger.error('Error sending SMS notifications:', error);
      throw error;
    }
  }
}

module.exports = new TicketController(); 