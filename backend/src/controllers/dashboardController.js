const db = require('../utils/database');
const logger = require('../utils/logger');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get ticket statistics
    const ticketStats = await db('tickets')
      .where('organization_id', organizationId)
      .select(
        db.raw('COUNT(*) as total_tickets'),
        db.raw('COUNT(CASE WHEN status = \'unassigned\' THEN 1 END) as unassigned_tickets'),
        db.raw('COUNT(CASE WHEN status = \'assigned\' THEN 1 END) as assigned_tickets'),
        db.raw('COUNT(CASE WHEN status = \'in_progress\' THEN 1 END) as in_progress_tickets'),
        db.raw('COUNT(CASE WHEN status = \'closed\' THEN 1 END) as closed_tickets'),
        db.raw('COUNT(CASE WHEN priority = \'high\' THEN 1 END) as high_priority'),
        db.raw('COUNT(CASE WHEN priority = \'critical\' THEN 1 END) as critical_tickets'),
        db.raw('COUNT(CASE WHEN due_date < NOW() AND status != \'closed\' THEN 1 END) as overdue_tickets'),
        db.raw('COUNT(CASE WHEN DATE(created_at) = DATE(NOW()) THEN 1 END) as tickets_today'),
        db.raw('COUNT(CASE WHEN DATE(closed_at) = DATE(NOW()) THEN 1 END) as closed_today')
      )
      .first();

    // Get client statistics
    const clientStats = await db('clients')
      .where('organization_id', organizationId)
      .select(
        db.raw('COUNT(*) as total_clients'),
        db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_clients')
      )
      .first();

    // Get user statistics
    const userStats = await db('users')
      .join('user_organizations', 'users.id', 'user_organizations.user_id')
      .where('user_organizations.organization_id', organizationId)
      .select(
        db.raw('COUNT(*) as total_users'),
        db.raw('COUNT(CASE WHEN users.role = \'admin\' THEN 1 END) as admin_users'),
        db.raw('COUNT(CASE WHEN users.role = \'technician\' THEN 1 END) as technician_users')
      )
      .first();

    // Get recent activity (last 10 ticket updates)
    const recentActivity = await db('tickets')
      .join('clients', 'tickets.client_id', 'clients.id')
      .join('users as creator', 'tickets.created_by', 'creator.id')
      .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
      .where('tickets.organization_id', organizationId)
      .select(
        'tickets.id',
        'tickets.subject',
        'tickets.status',
        'tickets.priority',
        'tickets.updated_at',
        'clients.name as client_name',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name'
      )
      .orderBy('tickets.updated_at', 'desc')
      .limit(10);

    // Get ticket trends for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ticketTrends = await db('tickets')
      .where('organization_id', organizationId)
      .where('created_at', '>=', sevenDaysAgo)
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COUNT(*) as count')
      )
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // Get priority distribution
    const priorityDistribution = await db('tickets')
      .where('organization_id', organizationId)
      .where('status', '!=', 'closed')
      .select(
        'priority',
        db.raw('COUNT(*) as count')
      )
      .groupBy('priority')
      .orderBy('priority', 'asc');

    res.json({
      success: true,
      data: {
        tickets: {
          total: parseInt(ticketStats.total_tickets) || 0,
          unassigned: parseInt(ticketStats.unassigned_tickets) || 0,
          assigned: parseInt(ticketStats.assigned_tickets) || 0,
          inProgress: parseInt(ticketStats.in_progress_tickets) || 0,
          closed: parseInt(ticketStats.closed_tickets) || 0,
          highPriority: parseInt(ticketStats.high_priority) || 0,
          critical: parseInt(ticketStats.critical_tickets) || 0,
          overdue: parseInt(ticketStats.overdue_tickets) || 0,
          createdToday: parseInt(ticketStats.tickets_today) || 0,
          closedToday: parseInt(ticketStats.closed_today) || 0
        },
        clients: {
          total: parseInt(clientStats.total_clients) || 0,
          active: parseInt(clientStats.active_clients) || 0
        },
        users: {
          total: parseInt(userStats.total_users) || 0,
          admins: parseInt(userStats.admin_users) || 0,
          technicians: parseInt(userStats.technician_users) || 0
        },
        recentActivity,
        trends: ticketTrends,
        priorityDistribution
      }
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
}; 