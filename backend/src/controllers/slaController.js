const db = require('../utils/database');
const slaService = require('../services/slaService');
const logger = require('../utils/logger');

class SLAController {
  /**
   * Get all SLA definitions for an organization
   */
  async getSLADefinitions(req, res) {
    try {
      const { organizationId } = req.params;
      const { is_active } = req.query;

      let query = db('sla_definitions')
        .where('organization_id', organizationId);

      if (is_active !== undefined) {
        query = query.where('is_active', is_active === 'true');
      }

      const slaDefinitions = await query.orderBy('priority', 'asc');

      res.json({
        success: true,
        data: slaDefinitions
      });
    } catch (error) {
      logger.error('Error getting SLA definitions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SLA definitions',
        error: error.message
      });
    }
  }

  /**
   * Get a specific SLA definition
   */
  async getSLADefinition(req, res) {
    try {
      const { id } = req.params;

      const slaDefinition = await db('sla_definitions')
        .where('id', id)
        .first();

      if (!slaDefinition) {
        return res.status(404).json({
          success: false,
          message: 'SLA definition not found'
        });
      }

      res.json({
        success: true,
        data: slaDefinition
      });
    } catch (error) {
      logger.error('Error getting SLA definition:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SLA definition',
        error: error.message
      });
    }
  }

  /**
   * Create a new SLA definition
   */
  async createSLADefinition(req, res) {
    try {
      const {
        organization_id,
        name,
        description,
        priority,
        ticket_type,
        response_time_hours,
        resolution_time_hours,
        business_hours_start,
        business_hours_end,
        business_days,
        holidays
      } = req.body;

      // Validate required fields
      if (!organization_id || !name || !priority || !ticket_type || 
          !response_time_hours || !resolution_time_hours) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const [slaDefinition] = await db('sla_definitions')
        .insert({
          organization_id,
          name,
          description,
          priority,
          ticket_type,
          response_time_hours,
          resolution_time_hours,
          business_hours_start: business_hours_start || 9,
          business_hours_end: business_hours_end || 17,
          business_days: business_days || [1, 2, 3, 4, 5],
          holidays: holidays || []
        })
        .returning('*');

      res.status(201).json({
        success: true,
        data: slaDefinition
      });
    } catch (error) {
      logger.error('Error creating SLA definition:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create SLA definition',
        error: error.message
      });
    }
  }

  /**
   * Update an SLA definition
   */
  async updateSLADefinition(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [updatedSLA] = await db('sla_definitions')
        .where('id', id)
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*');

      if (!updatedSLA) {
        return res.status(404).json({
          success: false,
          message: 'SLA definition not found'
        });
      }

      res.json({
        success: true,
        data: updatedSLA
      });
    } catch (error) {
      logger.error('Error updating SLA definition:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update SLA definition',
        error: error.message
      });
    }
  }

  /**
   * Delete an SLA definition
   */
  async deleteSLADefinition(req, res) {
    try {
      const { id } = req.params;

      const deleted = await db('sla_definitions')
        .where('id', id)
        .del();

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'SLA definition not found'
        });
      }

      res.json({
        success: true,
        message: 'SLA definition deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting SLA definition:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete SLA definition',
        error: error.message
      });
    }
  }

  /**
   * Get SLA violations for an organization
   */
  async getSLAViolations(req, res) {
    try {
      const { organizationId } = req.params;
      const { 
        is_resolved, 
        violation_type, 
        start_date, 
        end_date,
        page = 1,
        limit = 20
      } = req.query;

      let query = db('sla_violations')
        .join('tickets', 'tickets.id', 'sla_violations.ticket_id')
        .where('sla_violations.organization_id', organizationId)
        .select(
          'sla_violations.*',
          'tickets.ticket_number',
          'tickets.subject',
          'tickets.priority',
          'tickets.status'
        );

      if (is_resolved !== undefined) {
        query = query.where('sla_violations.is_resolved', is_resolved === 'true');
      }

      if (violation_type) {
        query = query.where('sla_violations.violation_type', violation_type);
      }

      if (start_date && end_date) {
        query = query.whereBetween('sla_violations.created_at', [start_date, end_date]);
      }

      const offset = (page - 1) * limit;
      const violations = await query
        .orderBy('sla_violations.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('sla_violations')
        .where('organization_id', organizationId)
        .count('* as count')
        .first();

      res.json({
        success: true,
        data: violations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(total.count / limit)
        }
      });
    } catch (error) {
      logger.error('Error getting SLA violations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SLA violations',
        error: error.message
      });
    }
  }

  /**
   * Get SLA statistics for an organization
   */
  async getSLAStats(req, res) {
    try {
      const { organizationId } = req.params;
      const { start_date, end_date } = req.query;

      const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = end_date ? new Date(end_date) : new Date();

      const stats = await slaService.getSLAStats(organizationId, startDate, endDate);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting SLA stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get SLA stats',
        error: error.message
      });
    }
  }

  /**
   * Calculate SLA due date for a ticket
   */
  async calculateSLADueDate(req, res) {
    try {
      const { organizationId, priority, ticketType } = req.body;
      const { start_time } = req.body;

      if (!organizationId || !priority || !ticketType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: organizationId, priority, ticketType'
        });
      }

      const startTime = start_time ? new Date(start_time) : new Date();
      const dueDate = await slaService.calculateSLADueDate(organizationId, priority, ticketType, startTime);

      res.json({
        success: true,
        data: {
          due_date: dueDate,
          start_time: startTime,
          priority,
          ticket_type: ticketType
        }
      });
    } catch (error) {
      logger.error('Error calculating SLA due date:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate SLA due date',
        error: error.message
      });
    }
  }

  /**
   * Check SLA violations for a specific ticket
   */
  async checkTicketSLAViolations(req, res) {
    try {
      const { ticketId } = req.params;

      const violations = await slaService.checkSLAViolations(ticketId);

      res.json({
        success: true,
        data: violations
      });
    } catch (error) {
      logger.error('Error checking ticket SLA violations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check SLA violations',
        error: error.message
      });
    }
  }
}

module.exports = new SLAController(); 