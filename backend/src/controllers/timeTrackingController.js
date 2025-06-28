const timeTrackingService = require('../services/timeTrackingService');
const billingService = require('../services/billingService');
const logger = require('../utils/logger');

class TimeTrackingController {
  /**
   * Create a new time entry
   */
  async createTimeEntry(req, res) {
    try {
      const {
        ticket_id,
        description,
        start_time,
        end_time,
        billable_rate,
        is_billable,
        activity_type,
        metadata
      } = req.body;

      const timeEntry = await timeTrackingService.createTimeEntry({
        ticket_id,
        user_id: req.user.id,
        organization_id: req.user.organization_id,
        description,
        start_time,
        end_time,
        billable_rate,
        is_billable,
        activity_type,
        metadata
      });

      res.status(201).json({
        success: true,
        data: timeEntry
      });
    } catch (error) {
      logger.error('Error creating time entry:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get time entries for a ticket
   */
  async getTimeEntries(req, res) {
    try {
      const { ticket_id } = req.params;
      const filters = req.query;

      const timeEntries = await timeTrackingService.getTimeEntries(ticket_id, filters);

      res.json({
        success: true,
        data: timeEntries
      });
    } catch (error) {
      logger.error('Error getting time entries:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update a time entry
   */
  async updateTimeEntry(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const timeEntry = await timeTrackingService.updateTimeEntry(id, updateData);

      res.json({
        success: true,
        data: timeEntry
      });
    } catch (error) {
      logger.error('Error updating time entry:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(req, res) {
    try {
      const { id } = req.params;

      await timeTrackingService.deleteTimeEntry(id);

      res.json({
        success: true,
        message: 'Time entry deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting time entry:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get time tracking statistics
   */
  async getTimeStats(req, res) {
    try {
      const filters = req.query;

      const stats = await timeTrackingService.getTimeStats(req.user.organization_id, filters);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting time stats:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generate invoice from time entries
   */
  async generateInvoice(req, res) {
    try {
      const { client_id } = req.params;
      const filters = req.body;

      const invoice = await timeTrackingService.generateInvoice(
        client_id,
        req.user.organization_id,
        filters
      );

      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error generating invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create a billing rate
   */
  async createBillingRate(req, res) {
    try {
      const billingRate = await billingService.createBillingRate({
        ...req.body,
        organization_id: req.user.organization_id
      });

      res.status(201).json({
        success: true,
        data: billingRate
      });
    } catch (error) {
      logger.error('Error creating billing rate:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get billing rates
   */
  async getBillingRates(req, res) {
    try {
      const filters = req.query;

      const billingRates = await billingService.getBillingRates(req.user.organization_id, filters);

      res.json({
        success: true,
        data: billingRates
      });
    } catch (error) {
      logger.error('Error getting billing rates:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update a billing rate
   */
  async updateBillingRate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const billingRate = await billingService.updateBillingRate(id, updateData);

      res.json({
        success: true,
        data: billingRate
      });
    } catch (error) {
      logger.error('Error updating billing rate:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete a billing rate
   */
  async deleteBillingRate(req, res) {
    try {
      const { id } = req.params;

      await billingService.deleteBillingRate(id);

      res.json({
        success: true,
        message: 'Billing rate deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting billing rate:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get invoices
   */
  async getInvoices(req, res) {
    try {
      const filters = req.query;

      const invoices = await billingService.getInvoices(req.user.organization_id, filters);

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      logger.error('Error getting invoices:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get a specific invoice
   */
  async getInvoice(req, res) {
    try {
      const { id } = req.params;

      const invoice = await billingService.getInvoice(id);

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error getting invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, payment_data } = req.body;

      const invoice = await billingService.updateInvoiceStatus(id, status, payment_data);

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Error updating invoice status:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(req, res) {
    try {
      const filters = req.query;

      const stats = await billingService.getBillingStats(req.user.organization_id, filters);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting billing stats:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new TimeTrackingController(); 