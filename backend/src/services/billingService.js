const knex = require('../utils/database');
const logger = require('../utils/logger');
const emailService = require('./emailService');

class BillingService {
  /**
   * Create a new billing rate
   */
  async createBillingRate(data) {
    try {
      const {
        organization_id,
        user_id,
        client_id,
        rate_name,
        hourly_rate,
        rate_type = 'default',
        service_type = 'incident',
        effective_date,
        expiry_date,
        description
      } = data;

      // Validate required fields
      if (!organization_id || !rate_name || !hourly_rate) {
        throw new Error('Missing required fields: organization_id, rate_name, hourly_rate');
      }

      // Check for duplicate rates
      const existingRate = await knex('billing_rates')
        .where({
          organization_id,
          user_id: user_id || null,
          client_id: client_id || null,
          rate_name,
          service_type
        })
        .first();

      if (existingRate) {
        throw new Error('A billing rate with this configuration already exists');
      }

      const [billingRate] = await knex('billing_rates')
        .insert({
          organization_id,
          user_id,
          client_id,
          rate_name,
          hourly_rate,
          rate_type,
          service_type,
          effective_date: effective_date || new Date(),
          expiry_date,
          description
        })
        .returning('*');

      return billingRate;
    } catch (error) {
      logger.error('Error creating billing rate:', error);
      throw error;
    }
  }

  /**
   * Get billing rates for an organization
   */
  async getBillingRates(organizationId, filters = {}) {
    try {
      let query = knex('billing_rates')
        .where('organization_id', organizationId);

      if (filters.rate_type) {
        query = query.where('rate_type', filters.rate_type);
      }

      if (filters.service_type) {
        query = query.where('service_type', filters.service_type);
      }

      if (filters.user_id) {
        query = query.where('user_id', filters.user_id);
      }

      if (filters.client_id) {
        query = query.where('client_id', filters.client_id);
      }

      if (filters.is_active !== undefined) {
        query = query.where('is_active', filters.is_active);
      }

      const billingRates = await query.orderBy('effective_date', 'desc');

      return billingRates;
    } catch (error) {
      logger.error('Error getting billing rates:', error);
      throw error;
    }
  }

  /**
   * Update a billing rate
   */
  async updateBillingRate(id, updateData) {
    try {
      const [updatedRate] = await knex('billing_rates')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      if (!updatedRate) {
        throw new Error('Billing rate not found');
      }

      return updatedRate;
    } catch (error) {
      logger.error('Error updating billing rate:', error);
      throw error;
    }
  }

  /**
   * Delete a billing rate
   */
  async deleteBillingRate(id) {
    try {
      const deleted = await knex('billing_rates')
        .where('id', id)
        .del();

      if (!deleted) {
        throw new Error('Billing rate not found');
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting billing rate:', error);
      throw error;
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data) {
    try {
      const {
        organization_id,
        client_id,
        invoice_number,
        subtotal = 0,
        tax_rate = 0,
        total_amount,
        invoice_date,
        due_date,
        notes,
        billing_address,
        shipping_address,
        payment_terms
      } = data;

      // Validate required fields
      if (!organization_id || !client_id || !invoice_number) {
        throw new Error('Missing required fields: organization_id, client_id, invoice_number');
      }

      // Calculate amounts
      const taxAmount = (subtotal * tax_rate) / 100;
      const finalTotal = subtotal + taxAmount;

      const [invoice] = await knex('invoices')
        .insert({
          organization_id,
          client_id,
          invoice_number,
          subtotal,
          tax_rate,
          tax_amount: taxAmount,
          total_amount: total_amount || finalTotal,
          balance_due: total_amount || finalTotal,
          invoice_date: invoice_date || new Date(),
          due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          notes,
          billing_address: JSON.stringify(billing_address || {}),
          shipping_address: JSON.stringify(shipping_address || {}),
          payment_terms: JSON.stringify(payment_terms || {})
        })
        .returning('*');

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoices for an organization
   */
  async getInvoices(organizationId, filters = {}) {
    try {
      let query = knex('invoices')
        .join('clients', 'invoices.client_id', 'clients.id')
        .where('invoices.organization_id', organizationId)
        .select(
          'invoices.*',
          'clients.name as client_name',
          'clients.email as client_email'
        );

      if (filters.status) {
        query = query.where('invoices.status', filters.status);
      }

      if (filters.client_id) {
        query = query.where('invoices.client_id', filters.client_id);
      }

      if (filters.start_date && filters.end_date) {
        query = query.whereBetween('invoices.invoice_date', [filters.start_date, filters.end_date]);
      }

      const invoices = await query.orderBy('invoices.invoice_date', 'desc');

      return invoices;
    } catch (error) {
      logger.error('Error getting invoices:', error);
      throw error;
    }
  }

  /**
   * Get a specific invoice with items
   */
  async getInvoice(id) {
    try {
      const invoice = await knex('invoices')
        .join('clients', 'invoices.client_id', 'clients.id')
        .where('invoices.id', id)
        .select(
          'invoices.*',
          'clients.name as client_name',
          'clients.email as client_email',
          'clients.phone as client_phone'
        )
        .first();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Get invoice items
      const items = await knex('invoice_items')
        .leftJoin('time_entries', 'invoice_items.time_entry_id', 'time_entries.id')
        .leftJoin('tickets', 'invoice_items.ticket_id', 'tickets.id')
        .where('invoice_items.invoice_id', id)
        .select(
          'invoice_items.*',
          'time_entries.description as time_description',
          'tickets.ticket_number',
          'tickets.subject as ticket_subject'
        )
        .orderBy('invoice_items.created_at', 'asc');

      return {
        ...invoice,
        items
      };
    } catch (error) {
      logger.error('Error getting invoice:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(id, status, paymentData = {}) {
    try {
      const updateData = { status };

      if (status === 'paid' && paymentData.amount) {
        updateData.amount_paid = paymentData.amount;
        updateData.paid_date = new Date();
        updateData.balance_due = 0;
      }

      const [updatedInvoice] = await knex('invoices')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      if (!updatedInvoice) {
        throw new Error('Invoice not found');
      }

      // Send notification if invoice is paid
      if (status === 'paid') {
        await this.sendInvoicePaidNotification(updatedInvoice);
      }

      return updatedInvoice;
    } catch (error) {
      logger.error('Error updating invoice status:', error);
      throw error;
    }
  }

  /**
   * Add item to invoice
   */
  async addInvoiceItem(invoiceId, itemData) {
    try {
      const {
        time_entry_id,
        ticket_id,
        description,
        quantity,
        unit_rate,
        amount,
        item_type = 'time',
        metadata = {}
      } = itemData;

      const [invoiceItem] = await knex('invoice_items')
        .insert({
          invoice_id: invoiceId,
          time_entry_id,
          ticket_id,
          description,
          quantity,
          unit_rate,
          amount,
          item_type,
          metadata: JSON.stringify(metadata)
        })
        .returning('*');

      // Update invoice totals
      await this.updateInvoiceTotals(invoiceId);

      return invoiceItem;
    } catch (error) {
      logger.error('Error adding invoice item:', error);
      throw error;
    }
  }

  /**
   * Update invoice totals
   */
  async updateInvoiceTotals(invoiceId) {
    try {
      const items = await knex('invoice_items')
        .where('invoice_id', invoiceId)
        .select('amount');

      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);

      const invoice = await knex('invoices')
        .where('id', invoiceId)
        .first();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const taxAmount = (subtotal * invoice.tax_rate) / 100;
      const totalAmount = subtotal + taxAmount;
      const balanceDue = totalAmount - parseFloat(invoice.amount_paid || 0);

      await knex('invoices')
        .where('id', invoiceId)
        .update({
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          balance_due: balanceDue,
          updated_at: new Date()
        });
    } catch (error) {
      logger.error('Error updating invoice totals:', error);
      throw error;
    }
  }

  /**
   * Send invoice paid notification
   */
  async sendInvoicePaidNotification(invoice) {
    try {
      await emailService.sendEmail({
        to: invoice.client_email,
        template: 'invoice-paid',
        data: {
          clientName: invoice.client_name,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.total_amount,
          paidDate: invoice.paid_date
        }
      });
    } catch (error) {
      logger.error('Error sending invoice paid notification:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(organizationId, filters = {}) {
    try {
      const { start_date, end_date, client_id } = filters;

      let query = knex('invoices')
        .where('organization_id', organizationId);

      if (start_date && end_date) {
        query = query.whereBetween('invoice_date', [start_date, end_date]);
      }

      if (client_id) {
        query = query.where('client_id', client_id);
      }

      const stats = await query
        .select('status')
        .sum('total_amount as total')
        .groupBy('status');

      const totalInvoiced = await query
        .sum('total_amount as total')
        .first();

      const totalPaid = await query
        .where('status', 'paid')
        .sum('total_amount as total')
        .first();

      const totalOutstanding = await query
        .whereIn('status', ['sent', 'overdue'])
        .sum('balance_due as total')
        .first();

      return {
        totalInvoiced: parseFloat(totalInvoiced.total || 0),
        totalPaid: parseFloat(totalPaid.total || 0),
        totalOutstanding: parseFloat(totalOutstanding.total || 0),
        statsByStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = parseFloat(stat.total);
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting billing stats:', error);
      throw error;
    }
  }
}

module.exports = new BillingService(); 