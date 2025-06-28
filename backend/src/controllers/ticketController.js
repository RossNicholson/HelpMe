const db = require('../utils/database');
const slaService = require('../services/slaService');
const escalationService = require('../services/escalationService');
const smsService = require('../services/smsService');
const clientUserService = require('../services/clientUserService');
const logger = require('../utils/logger');

/**
 * Get all tickets for an organization
 */
const getTickets = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { 
      status, 
      priority, 
      assigned_to, 
      client_id,
      page = 1,
      limit = 20,
      search
    } = req.query;

    let query = db('tickets')
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

    // For client users, filter tickets based on their permissions
    if (userRole === 'client') {
      // Get all clients the user has access to
      const userClients = await clientUserService.getUserClients(userId, organizationId);
      const clientIds = userClients.map(cu => cu.client_id);
      
      if (clientIds.length === 0) {
        // User has no client access, return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        });
      }

      // Filter by user's accessible clients
      query = query.whereIn('tickets.client_id', clientIds);

      // Check if user can view all tickets for each client
      const canViewAllTickets = await Promise.all(
        clientIds.map(clientId => 
          clientUserService.canUserViewAllTickets(userId, clientId, organizationId)
        )
      );

      // If user can't view all tickets for any client, filter by tickets they created
      if (!canViewAllTickets.some(can => can)) {
        query = query.where('tickets.created_by', userId);
      }
    }

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

    const total = await db('tickets')
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
};

/**
 * Get a specific ticket
 */
const getTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await db('tickets')
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
    const comments = await db('ticket_comments')
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
};

/**
 * Create a new ticket
 */
const createTicket = async (req, res) => {
  try {
    const {
      client_id,
      subject,
      description,
      priority = 'medium',
      type = 'incident',
      source = 'portal',
      due_date,
      tags = [],
      custom_fields = {}
    } = req.body;

    if (!client_id || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Client ID, subject, and description are required'
      });
    }

    const organizationId = req.user.organization_id;
    const ticketNumber = await generateTicketNumber(organizationId);

    // New tickets are always unassigned initially
    const [ticket] = await db('tickets')
      .insert({
        organization_id: organizationId,
        client_id,
        created_by: req.user.id,
        assigned_to: null, // Always null for new tickets
        ticket_number: ticketNumber,
        subject,
        description,
        priority,
        type,
        source,
        status: 'unassigned', // New tickets are unassigned
        due_date,
        tags: JSON.stringify(tags),
        custom_fields: JSON.stringify(custom_fields)
      })
      .returning('*');

    // Send SMS notification
    await sendTicketSMSNotifications(ticket, 'created');

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
};

/**
 * Update a ticket
 */
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subject,
      description,
      priority,
      type,
      assigned_to,
      tags,
      custom_fields
    } = req.body;

    const ticket = await db('tickets')
      .where('id', id)
      .first();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const updateData = {};
    if (subject) updateData.subject = subject;
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (type) updateData.type = type;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (tags) updateData.tags = JSON.stringify(tags);
    if (custom_fields) updateData.custom_fields = JSON.stringify(custom_fields);

    const [updatedTicket] = await db('tickets')
      .where('id', id)
      .update(updateData)
      .returning('*');

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
};

/**
 * Delete a ticket
 */
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await db('tickets')
      .where('id', id)
      .first();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await db('tickets')
      .where('id', id)
      .del();

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
};

/**
 * Add a comment to a ticket
 */
const addComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content, is_internal = false } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const [comment] = await db('ticket_comments')
      .insert({
        ticket_id: ticketId,
        user_id: req.user.id,
        content,
        is_internal
      })
      .returning('*');

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
};

/**
 * Update ticket status
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const [ticket] = await db('tickets')
      .where('id', id)
      .update({ status })
      .returning('*');

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
    logger.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
};

/**
 * Assign ticket to user
 */
const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    // Determine the new status based on assignment
    let newStatus = 'unassigned';
    if (assigned_to) {
      newStatus = 'assigned';
    }

    const [ticket] = await db('tickets')
      .where('id', id)
      .update({ 
        assigned_to,
        status: newStatus // Automatically update status based on assignment
      })
      .returning('*');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Send SMS notification if assigned
    if (assigned_to) {
      await sendTicketSMSNotifications(ticket, 'assigned');
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    logger.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
};

/**
 * Get ticket statistics
 */
const getTicketStats = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const stats = await db('tickets')
      .where('organization_id', organizationId)
      .select(
        db.raw('COUNT(*) as total_tickets'),
        db.raw('COUNT(CASE WHEN status = \'unassigned\' THEN 1 END) as unassigned_tickets'),
        db.raw('COUNT(CASE WHEN status = \'assigned\' THEN 1 END) as assigned_tickets'),
        db.raw('COUNT(CASE WHEN status = \'in_progress\' THEN 1 END) as in_progress_tickets'),
        db.raw('COUNT(CASE WHEN status = \'closed\' THEN 1 END) as closed_tickets'),
        db.raw('COUNT(CASE WHEN priority = \'high\' THEN 1 END) as high_priority_tickets'),
        db.raw('COUNT(CASE WHEN priority = \'critical\' THEN 1 END) as critical_tickets')
      )
      .first();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket statistics',
      error: error.message
    });
  }
};

/**
 * Generate unique ticket number
 */
const generateTicketNumber = async (organizationId) => {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;
  
  const lastTicket = await db('tickets')
    .where('organization_id', organizationId)
    .where('ticket_number', 'like', `${prefix}%`)
    .orderBy('ticket_number', 'desc')
    .first();

  let sequence = 1;
  if (lastTicket) {
    const lastNumber = parseInt(lastTicket.ticket_number.replace(prefix, ''));
    sequence = lastNumber + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

/**
 * Send SMS notifications for ticket events
 */
const sendTicketSMSNotifications = async (ticket, eventType) => {
  try {
    // Get client phone number
    const client = await db('clients')
      .where('id', ticket.client_id)
      .first();

    if (client && client.phone) {
      let message = '';
      switch (eventType) {
        case 'created':
          message = `New ticket ${ticket.ticket_number} has been created: ${ticket.subject}`;
          break;
        case 'updated':
          message = `Ticket ${ticket.ticket_number} has been updated`;
          break;
        case 'assigned':
          message = `Ticket ${ticket.ticket_number} has been assigned to you`;
          break;
      }

      if (message) {
        await smsService.sendSMS(client.phone, message);
      }
    }
  } catch (error) {
    logger.error('Error sending ticket SMS notification:', error);
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
  updateStatus,
  assignTicket,
  getTicketStats
}; 