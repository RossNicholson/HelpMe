const db = require('../utils/database');
const smsService = require('./smsService');
const logger = require('../utils/logger');

class SLAService {
  /**
   * Calculate SLA due date based on priority and ticket type
   */
  async calculateSLADueDate(organizationId, priority, ticketType, startTime = new Date()) {
    try {
      const slaDefinition = await db('sla_definitions')
        .where({
          organization_id: organizationId,
          priority: priority,
          ticket_type: ticketType,
          is_active: true
        })
        .first();

      if (!slaDefinition) {
        logger.warn(`No SLA definition found for org: ${organizationId}, priority: ${priority}, type: ${ticketType}`);
        return null;
      }

      const dueDate = this.addBusinessHours(startTime, slaDefinition.resolution_time_hours, slaDefinition);
      return dueDate;
    } catch (error) {
      logger.error('Error calculating SLA due date:', error);
      throw error;
    }
  }

  /**
   * Add business hours to a date, considering business hours and holidays
   */
  addBusinessHours(startDate, hoursToAdd, slaDefinition) {
    const businessHoursStart = slaDefinition.business_hours_start || 9;
    const businessHoursEnd = slaDefinition.business_hours_end || 17;
    const businessDays = slaDefinition.business_days || [1, 2, 3, 4, 5]; // Monday to Friday
    const holidays = slaDefinition.holidays || [];

    let currentDate = new Date(startDate);
    let remainingHours = hoursToAdd;

    while (remainingHours > 0) {
      // Check if current day is a business day
      const dayOfWeek = currentDate.getDay();
      const isBusinessDay = businessDays.includes(dayOfWeek);
      
      // Check if current day is a holiday
      const dateString = currentDate.toISOString().split('T')[0];
      const isHoliday = holidays.includes(dateString);

      if (isBusinessDay && !isHoliday) {
        const currentHour = currentDate.getHours();
        
        // If before business hours, move to start of business hours
        if (currentHour < businessHoursStart) {
          currentDate.setHours(businessHoursStart, 0, 0, 0);
        }
        // If after business hours, move to next business day
        else if (currentHour >= businessHoursEnd) {
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(businessHoursStart, 0, 0, 0);
          continue;
        }
        // If during business hours, add hours
        else {
          const availableHours = businessHoursEnd - currentHour;
          const hoursToAddToday = Math.min(remainingHours, availableHours);
          
          currentDate.setHours(currentDate.getHours() + hoursToAddToday);
          remainingHours -= hoursToAddToday;
          
          // If we've used all available hours today, move to next day
          if (remainingHours > 0) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(businessHoursStart, 0, 0, 0);
          }
        }
      } else {
        // Not a business day, move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(businessHoursStart, 0, 0, 0);
      }
    }

    return currentDate;
  }

  /**
   * Check for SLA violations and create violation records
   */
  async checkSLAViolations(ticketId) {
    try {
      const ticket = await db('tickets')
        .join('clients', 'tickets.client_id', 'clients.id')
        .join('users as creator', 'tickets.created_by', 'creator.id')
        .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
        .where('tickets.id', ticketId)
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
        throw new Error('Ticket not found');
      }

      const slaDefinition = await db('sla_definitions')
        .where({
          organization_id: ticket.organization_id,
          priority: ticket.priority,
          ticket_type: ticket.type,
          is_active: true
        })
        .first();

      if (!slaDefinition) {
        return; // No SLA definition, no violations to check
      }

      const now = new Date();
      const violations = [];

      // Check response time violation
      if (!ticket.first_response_at && slaDefinition.response_time_hours) {
        const responseDueDate = this.addBusinessHours(ticket.created_at, slaDefinition.response_time_hours, slaDefinition);
        
        if (now > responseDueDate) {
          const violationMinutes = Math.floor((now - responseDueDate) / (1000 * 60));
          violations.push({
            ticket_id: ticketId,
            organization_id: ticket.organization_id,
            violation_type: 'response_time',
            expected_time: responseDueDate,
            violation_minutes: violationMinutes,
            sla_details: {
              sla_definition_id: slaDefinition.id,
              response_time_hours: slaDefinition.response_time_hours
            }
          });
        }
      }

      // Check resolution time violation
      if (!ticket.resolved_at && slaDefinition.resolution_time_hours) {
        const resolutionDueDate = this.addBusinessHours(ticket.created_at, slaDefinition.resolution_time_hours, slaDefinition);
        
        if (now > resolutionDueDate) {
          const violationMinutes = Math.floor((now - resolutionDueDate) / (1000 * 60));
          violations.push({
            ticket_id: ticketId,
            organization_id: ticket.organization_id,
            violation_type: 'resolution_time',
            expected_time: resolutionDueDate,
            violation_minutes: violationMinutes,
            sla_details: {
              sla_definition_id: slaDefinition.id,
              resolution_time_hours: slaDefinition.resolution_time_hours
            }
          });
        }
      }

      // Insert violations and send SMS notifications
      for (const violation of violations) {
        await db('sla_violations').insert(violation);
        
        // Send SMS notifications for SLA violations
        try {
          await this.sendSLAViolationSMS(ticket, violation);
        } catch (smsError) {
          logger.error('Failed to send SLA violation SMS:', smsError);
          // Don't fail the violation check if SMS fails
        }
      }

      return violations;
    } catch (error) {
      logger.error('Error checking SLA violations:', error);
      throw error;
    }
  }

  /**
   * Get SLA statistics for an organization
   */
  async getSLAStats(organizationId, startDate, endDate) {
    try {
      const stats = await db('sla_violations')
        .where('organization_id', organizationId)
        .whereBetween('created_at', [startDate, endDate])
        .select('violation_type')
        .count('* as count')
        .groupBy('violation_type');

      const totalTickets = await db('tickets')
        .where('organization_id', organizationId)
        .whereBetween('created_at', [startDate, endDate])
        .count('* as count')
        .first();

      const resolvedViolations = await db('sla_violations')
        .where('organization_id', organizationId)
        .whereBetween('created_at', [startDate, endDate])
        .where('is_resolved', true)
        .count('* as count')
        .first();

      return {
        totalTickets: parseInt(totalTickets.count),
        totalViolations: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
        resolvedViolations: parseInt(resolvedViolations.count),
        violationsByType: stats.reduce((acc, stat) => {
          acc[stat.violation_type] = parseInt(stat.count);
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting SLA stats:', error);
      throw error;
    }
  }

  /**
   * Resolve SLA violation when ticket is updated
   */
  async resolveSLAViolation(ticketId, violationType) {
    try {
      await db('sla_violations')
        .where({
          ticket_id: ticketId,
          violation_type: violationType,
          is_resolved: false
        })
        .update({
          is_resolved: true,
          resolved_at: new Date(),
          actual_time: new Date()
        });
    } catch (error) {
      logger.error('Error resolving SLA violation:', error);
      throw error;
    }
  }

  /**
   * Send SMS notifications for SLA violations
   */
  async sendSLAViolationSMS(ticket, violation) {
    try {
      const hours = Math.floor(violation.violation_minutes / 60);
      const minutes = violation.violation_minutes % 60;
      const breachTime = `${hours}h ${minutes}m`;

      const variables = {
        ticket_id: ticket.ticket_number,
        breach_time: breachTime,
        priority: ticket.priority,
        violation_type: violation.violation_type === 'response_time' ? 'Response Time' : 'Resolution Time'
      };

      // Send to assigned user
      if (ticket.assigned_to) {
        const userPreferences = await smsService.getUserSMSPreferences(ticket.assigned_to);
        
        for (const preference of userPreferences) {
          if (preference.notification_types && preference.notification_types.includes('sla_breached')) {
            await smsService.sendSMSTemplate(
              ticket.organization_id,
              preference.phone_number,
              'sla_breached',
              variables,
              {
                userId: ticket.assigned_to,
                ticketId: ticket.id
              }
            );
          }
        }
      }

      // Send to managers/admins (you can extend this based on your role system)
      const managers = await db('users')
        .join('user_organizations', 'users.id', 'user_organizations.user_id')
        .where('user_organizations.organization_id', ticket.organization_id)
        .where('user_organizations.role', 'admin')
        .select('users.id');

      for (const manager of managers) {
        if (manager.id !== ticket.assigned_to) { // Don't send duplicate to assigned user
          const userPreferences = await smsService.getUserSMSPreferences(manager.id);
          
          for (const preference of userPreferences) {
            if (preference.notification_types && preference.notification_types.includes('sla_breached')) {
              await smsService.sendSMSTemplate(
                ticket.organization_id,
                preference.phone_number,
                'sla_breached',
                variables,
                {
                  userId: manager.id,
                  ticketId: ticket.id
                }
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error sending SLA violation SMS:', error);
      throw error;
    }
  }
}

module.exports = new SLAService(); 