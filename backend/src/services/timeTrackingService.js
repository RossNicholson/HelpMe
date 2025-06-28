const knex = require('../utils/database');
const logger = require('../utils/logger');

class TimeTrackingService {
  /**
   * Create a new time entry
   */
  async createTimeEntry(data) {
    try {
      const {
        ticket_id,
        user_id,
        organization_id,
        description,
        start_time,
        end_time,
        billable_rate = 0,
        is_billable = true,
        activity_type = 'work',
        metadata = {}
      } = data;

      // Calculate minutes spent
      const start = new Date(start_time);
      const end = new Date(end_time);
      const minutesSpent = Math.round((end - start) / (1000 * 60));

      if (minutesSpent <= 0) {
        throw new Error('End time must be after start time');
      }

      // Get default billing rate if not provided
      let finalBillableRate = billable_rate;
      if (!billable_rate || billable_rate === 0) {
        const defaultRate = await this.getDefaultBillingRate(organization_id, user_id);
        finalBillableRate = defaultRate?.hourly_rate || 0;
      }

      const [timeEntry] = await knex('time_entries')
        .insert({
          ticket_id,
          user_id,
          organization_id,
          description,
          minutes_spent: minutesSpent,
          billable_rate: finalBillableRate,
          is_billable,
          activity_type,
          start_time: start,
          end_time: end,
          metadata: JSON.stringify(metadata)
        })
        .returning('*');

      // Update ticket's total time spent
      await this.updateTicketTimeSpent(ticket_id);

      return timeEntry;
    } catch (error) {
      logger.error('Error creating time entry:', error);
      throw error;
    }
  }

  /**
   * Get time entries for a ticket
   */
  async getTimeEntries(ticketId, filters = {}) {
    try {
      let query = knex('time_entries')
        .join('users', 'time_entries.user_id', 'users.id')
        .where('time_entries.ticket_id', ticketId)
        .select(
          'time_entries.*',
          'users.first_name',
          'users.last_name',
          'users.email'
        );

      if (filters.user_id) {
        query = query.where('time_entries.user_id', filters.user_id);
      }

      if (filters.is_billable !== undefined) {
        query = query.where('time_entries.is_billable', filters.is_billable);
      }

      if (filters.activity_type) {
        query = query.where('time_entries.activity_type', filters.activity_type);
      }

      if (filters.start_date && filters.end_date) {
        query = query.whereBetween('time_entries.start_time', [filters.start_date, filters.end_date]);
      }

      const timeEntries = await query.orderBy('time_entries.start_time', 'desc');

      return timeEntries;
    } catch (error) {
      logger.error('Error getting time entries:', error);
      throw error;
    }
  }

  /**
   * Update a time entry
   */
  async updateTimeEntry(id, updateData) {
    try {
      // If start_time or end_time changed, recalculate minutes_spent
      if (updateData.start_time || updateData.end_time) {
        const currentEntry = await knex('time_entries').where('id', id).first();
        if (!currentEntry) {
          throw new Error('Time entry not found');
        }

        const start = new Date(updateData.start_time || currentEntry.start_time);
        const end = new Date(updateData.end_time || currentEntry.end_time);
        const minutesSpent = Math.round((end - start) / (1000 * 60));

        if (minutesSpent <= 0) {
          throw new Error('End time must be after start time');
        }

        updateData.minutes_spent = minutesSpent;
      }

      const [updatedEntry] = await knex('time_entries')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      if (updatedEntry) {
        // Update ticket's total time spent
        await this.updateTicketTimeSpent(updatedEntry.ticket_id);
      }

      return updatedEntry;
    } catch (error) {
      logger.error('Error updating time entry:', error);
      throw error;
    }
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(id) {
    try {
      const timeEntry = await knex('time_entries').where('id', id).first();
      if (!timeEntry) {
        throw new Error('Time entry not found');
      }

      await knex('time_entries').where('id', id).del();

      // Update ticket's total time spent
      await this.updateTicketTimeSpent(timeEntry.ticket_id);

      return { success: true };
    } catch (error) {
      logger.error('Error deleting time entry:', error);
      throw error;
    }
  }

  /**
   * Update ticket's total time spent
   */
  async updateTicketTimeSpent(ticketId) {
    try {
      const totalMinutes = await knex('time_entries')
        .where('ticket_id', ticketId)
        .where('is_active', true)
        .sum('minutes_spent as total')
        .first();

      await knex('tickets')
        .where('id', ticketId)
        .update({
          time_spent_minutes: parseInt(totalMinutes.total || 0),
          updated_at: new Date()
        });
    } catch (error) {
      logger.error('Error updating ticket time spent:', error);
      throw error;
    }
  }

  /**
   * Get default billing rate for a user
   */
  async getDefaultBillingRate(organizationId, userId) {
    try {
      // First try to get user-specific rate
      let rate = await knex('billing_rates')
        .where({
          organization_id: organizationId,
          user_id: userId,
          rate_type: 'user_specific',
          is_active: true
        })
        .whereNull('expiry_date')
        .orWhere('expiry_date', '>', new Date())
        .orderBy('effective_date', 'desc')
        .first();

      // If no user-specific rate, get default rate
      if (!rate) {
        rate = await knex('billing_rates')
          .where({
            organization_id: organizationId,
            rate_type: 'default',
            is_active: true
          })
          .whereNull('expiry_date')
          .orWhere('expiry_date', '>', new Date())
          .orderBy('effective_date', 'desc')
          .first();
      }

      return rate;
    } catch (error) {
      logger.error('Error getting default billing rate:', error);
      throw error;
    }
  }

  /**
   * Get billing rate for a specific client and service
   */
  async getBillingRate(organizationId, userId, clientId, serviceType) {
    try {
      // Priority order: client-specific > user-specific > default
      let rate = await knex('billing_rates')
        .where({
          organization_id: organizationId,
          client_id: clientId,
          service_type: serviceType,
          is_active: true
        })
        .whereNull('expiry_date')
        .orWhere('expiry_date', '>', new Date())
        .orderBy('effective_date', 'desc')
        .first();

      if (!rate) {
        rate = await this.getDefaultBillingRate(organizationId, userId);
      }

      return rate;
    } catch (error) {
      logger.error('Error getting billing rate:', error);
      throw error;
    }
  }

  /**
   * Get time tracking statistics
   */
  async getTimeStats(organizationId, filters = {}) {
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

      const stats = await query
        .select('time_entries.activity_type', 'time_entries.is_billable')
        .sum('time_entries.minutes_spent as total_minutes')
        .groupBy('time_entries.activity_type', 'time_entries.is_billable');

      const totalBillable = await query
        .where('time_entries.is_billable', true)
        .sum('time_entries.minutes_spent as total_minutes')
        .first();

      const totalNonBillable = await query
        .where('time_entries.is_billable', false)
        .sum('time_entries.minutes_spent as total_minutes')
        .first();

      const totalAmount = await query
        .where('time_entries.is_billable', true)
        .sum(knex.raw('(time_entries.minutes_spent * time_entries.billable_rate) / 60 as total_amount'))
        .first();

      return {
        totalBillableMinutes: parseInt(totalBillable.total_minutes || 0),
        totalNonBillableMinutes: parseInt(totalNonBillable.total_minutes || 0),
        totalBillableAmount: parseFloat(totalAmount.total_amount || 0),
        statsByActivity: stats.reduce((acc, stat) => {
          const key = `${stat.activity_type}_${stat.is_billable}`;
          acc[key] = parseInt(stat.total_minutes);
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting time stats:', error);
      throw error;
    }
  }

  /**
   * Generate invoice from time entries
   */
  async generateInvoice(clientId, organizationId, filters = {}) {
    try {
      const { start_date, end_date, include_non_billable = false } = filters;

      // Get unbilled time entries
      let query = knex('time_entries')
        .join('tickets', 'time_entries.ticket_id', 'tickets.id')
        .leftJoin('invoice_items', 'time_entries.id', 'invoice_items.time_entry_id')
        .where('tickets.client_id', clientId)
        .where('tickets.organization_id', organizationId)
        .whereNull('invoice_items.id'); // Only unbilled entries

      if (!include_non_billable) {
        query = query.where('time_entries.is_billable', true);
      }

      if (start_date && end_date) {
        query = query.whereBetween('time_entries.start_time', [start_date, end_date]);
      }

      const timeEntries = await query.select('time_entries.*', 'tickets.ticket_number', 'tickets.subject');

      if (timeEntries.length === 0) {
        throw new Error('No unbilled time entries found for the specified period');
      }

      // Calculate totals
      const subtotal = timeEntries.reduce((sum, entry) => {
        return sum + ((entry.minutes_spent * entry.billable_rate) / 60);
      }, 0);

      // Create invoice
      const invoiceNumber = await this.generateInvoiceNumber(organizationId);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      const [invoice] = await knex('invoices')
        .insert({
          organization_id: organizationId,
          client_id: clientId,
          invoice_number: invoiceNumber,
          status: 'draft',
          subtotal: subtotal,
          total_amount: subtotal,
          balance_due: subtotal,
          invoice_date: new Date(),
          due_date: dueDate
        })
        .returning('*');

      // Create invoice items
      const invoiceItems = [];
      for (const entry of timeEntries) {
        const amount = (entry.minutes_spent * entry.billable_rate) / 60;
        const [invoiceItem] = await knex('invoice_items')
          .insert({
            invoice_id: invoice.id,
            time_entry_id: entry.id,
            ticket_id: entry.ticket_id,
            description: `${entry.description} (Ticket: ${entry.ticket_number})`,
            quantity: entry.minutes_spent / 60, // Convert to hours
            unit_rate: entry.billable_rate,
            amount: amount,
            item_type: 'time'
          })
          .returning('*');
        
        invoiceItems.push(invoiceItem);
      }

      return {
        invoice,
        items: invoiceItems,
        totalEntries: timeEntries.length,
        subtotal,
        totalAmount: subtotal
      };
    } catch (error) {
      logger.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber(organizationId) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    const lastInvoice = await knex('invoices')
      .where('organization_id', organizationId)
      .where('invoice_number', 'like', `${prefix}%`)
      .orderBy('invoice_number', 'desc')
      .first();

    let sequence = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[2]);
      sequence = lastNumber + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }
}

module.exports = new TimeTrackingService(); 