const knex = require('../utils/database');
const logger = require('../utils/logger');

class ReportService {
  /**
   * Get ticket analytics (counts by status, priority, type, etc.)
   */
  async getTicketAnalytics(organizationId, filters = {}) {
    try {
      const { start_date, end_date, client_id } = filters;
      let query = knex('tickets').where('organization_id', organizationId);
      if (start_date && end_date) {
        query = query.whereBetween('created_at', [start_date, end_date]);
      }
      if (client_id) {
        query = query.where('client_id', client_id);
      }
      // Status breakdown
      const statusCounts = await query.clone().select('status').count('* as count').groupBy('status');
      // Priority breakdown
      const priorityCounts = await query.clone().select('priority').count('* as count').groupBy('priority');
      // Type breakdown
      const typeCounts = await query.clone().select('type').count('* as count').groupBy('type');
      // Total tickets
      const total = await query.clone().count('* as count').first();
      // Overdue tickets
      const overdue = await query.clone().where('due_date', '<', knex.fn.now()).whereNot('status', 'closed').count('* as count').first();
      // Resolved tickets
      const resolved = await query.clone().where('status', 'resolved').count('* as count').first();
      // Closed tickets
      const closed = await query.clone().where('status', 'closed').count('* as count').first();
      return {
        total: parseInt(total.count || 0),
        statusCounts,
        priorityCounts,
        typeCounts,
        overdue: parseInt(overdue.count || 0),
        resolved: parseInt(resolved.count || 0),
        closed: parseInt(closed.count || 0)
      };
    } catch (error) {
      logger.error('Error getting ticket analytics:', error);
      throw error;
    }
  }

  /**
   * Get SLA compliance stats
   */
  async getSLACompliance(organizationId, filters = {}) {
    try {
      const { start_date, end_date, client_id } = filters;
      let query = knex('sla_violations').where('organization_id', organizationId);
      if (start_date && end_date) {
        query = query.whereBetween('created_at', [start_date, end_date]);
      }
      if (client_id) {
        query = query.where('client_id', client_id);
      }
      const totalBreaches = await query.clone().count('* as count').first();
      const byType = await query.clone().select('violation_type').count('* as count').groupBy('violation_type');
      return {
        totalBreaches: parseInt(totalBreaches.count || 0),
        byType
      };
    } catch (error) {
      logger.error('Error getting SLA compliance:', error);
      throw error;
    }
  }

  /**
   * Get time tracking analytics
   */
  async getTimeTrackingStats(organizationId, filters = {}) {
    try {
      const { start_date, end_date, user_id, client_id } = filters;
      let query = knex('time_entries')
        .join('tickets', 'time_entries.ticket_id', 'tickets.id')
        .where('time_entries.organization_id', organizationId)
        .where('time_entries.is_active', true);
      if (start_date && end_date) {
        query = query.whereBetween('time_entries.start_time', [start_date, end_date]);
      }
      if (user_id) {
        query = query.where('time_entries.user_id', user_id);
      }
      if (client_id) {
        query = query.where('tickets.client_id', client_id);
      }
      const totalMinutes = await query.clone().sum('time_entries.minutes_spent as total').first();
      const byActivity = await query.clone().select('time_entries.activity_type').sum('time_entries.minutes_spent as total').groupBy('time_entries.activity_type');
      const billable = await query.clone().where('time_entries.is_billable', true).sum('time_entries.minutes_spent as total').first();
      const nonBillable = await query.clone().where('time_entries.is_billable', false).sum('time_entries.minutes_spent as total').first();
      return {
        totalMinutes: parseInt(totalMinutes.total || 0),
        byActivity,
        billableMinutes: parseInt(billable.total || 0),
        nonBillableMinutes: parseInt(nonBillable.total || 0)
      };
    } catch (error) {
      logger.error('Error getting time tracking stats:', error);
      throw error;
    }
  }

  /**
   * Get billing analytics
   */
  async getBillingStats(organizationId, filters = {}) {
    try {
      const { start_date, end_date, client_id } = filters;
      let query = knex('invoices').where('organization_id', organizationId);
      if (start_date && end_date) {
        query = query.whereBetween('invoice_date', [start_date, end_date]);
      }
      if (client_id) {
        query = query.where('client_id', client_id);
      }
      const totalInvoiced = await query.clone().sum('total_amount as total').first();
      const totalPaid = await query.clone().where('status', 'paid').sum('total_amount as total').first();
      const totalOutstanding = await query.clone().whereIn('status', ['sent', 'overdue']).sum('balance_due as total').first();
      const byStatus = await query.clone().select('status').sum('total_amount as total').groupBy('status');
      return {
        totalInvoiced: parseFloat(totalInvoiced.total || 0),
        totalPaid: parseFloat(totalPaid.total || 0),
        totalOutstanding: parseFloat(totalOutstanding.total || 0),
        byStatus
      };
    } catch (error) {
      logger.error('Error getting billing stats:', error);
      throw error;
    }
  }

  /**
   * Get client performance analytics
   */
  async getClientPerformance(organizationId, filters = {}) {
    try {
      const { start_date, end_date } = filters;
      let query = knex('clients').where('organization_id', organizationId);
      // Tickets per client
      const ticketCounts = await knex('tickets')
        .where('organization_id', organizationId)
        .modify((qb) => {
          if (start_date && end_date) {
            qb.whereBetween('created_at', [start_date, end_date]);
          }
        })
        .select('client_id')
        .count('* as count')
        .groupBy('client_id');
      // SLA breaches per client
      const slaBreaches = await knex('sla_violations')
        .where('organization_id', organizationId)
        .modify((qb) => {
          if (start_date && end_date) {
            qb.whereBetween('created_at', [start_date, end_date]);
          }
        })
        .select('client_id')
        .count('* as count')
        .groupBy('client_id');
      return {
        ticketCounts,
        slaBreaches
      };
    } catch (error) {
      logger.error('Error getting client performance:', error);
      throw error;
    }
  }
}

module.exports = new ReportService(); 