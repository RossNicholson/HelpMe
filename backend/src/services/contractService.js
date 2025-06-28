const { db } = require('../utils/database');
const logger = require('../utils/logger');

class ContractService {
  // Get all contracts for an organization
  async getContracts(organizationId, filters = {}) {
    try {
      let query = db('contracts')
        .select(
          'contracts.*',
          'clients.name as client_name',
          'clients.email as client_email',
          'users.name as created_by_name'
        )
        .join('clients', 'contracts.client_id', 'clients.id')
        .join('users', 'contracts.created_by', 'users.id')
        .where('contracts.organization_id', organizationId);

      // Apply filters
      if (filters.status) {
        query = query.where('contracts.status', filters.status);
      }
      if (filters.type) {
        query = query.where('contracts.type', filters.type);
      }
      if (filters.client_id) {
        query = query.where('contracts.client_id', filters.client_id);
      }
      if (filters.search) {
        query = query.where(function() {
          this.where('contracts.name', 'like', `%${filters.search}%`)
            .orWhere('contracts.contract_number', 'like', `%${filters.search}%`)
            .orWhere('clients.name', 'like', `%${filters.search}%`);
        });
      }

      const contracts = await query.orderBy('contracts.created_at', 'desc');
      
      // Add contract metrics
      const contractsWithMetrics = await Promise.all(
        contracts.map(async (contract) => {
          const metrics = await this.getContractMetrics(contract.id);
          return { ...contract, metrics };
        })
      );

      return contractsWithMetrics;
    } catch (error) {
      logger.error('Error fetching contracts:', error);
      throw error;
    }
  }

  // Get a single contract by ID
  async getContractById(contractId, organizationId) {
    try {
      const contract = await db('contracts')
        .select(
          'contracts.*',
          'clients.name as client_name',
          'clients.email as client_email',
          'clients.phone as client_phone',
          'users.name as created_by_name',
          'updater.name as updated_by_name'
        )
        .join('clients', 'contracts.client_id', 'clients.id')
        .join('users', 'contracts.created_by', 'users.id')
        .leftJoin('users as updater', 'contracts.updated_by', 'updater.id')
        .where('contracts.id', contractId)
        .where('contracts.organization_id', organizationId)
        .first();

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Add contract metrics
      const metrics = await this.getContractMetrics(contractId);
      contract.metrics = metrics;

      return contract;
    } catch (error) {
      logger.error('Error fetching contract:', error);
      throw error;
    }
  }

  // Create a new contract
  async createContract(contractData, userId, organizationId) {
    try {
      // Generate contract number
      const contractNumber = await this.generateContractNumber(organizationId);
      
      const contract = {
        ...contractData,
        organization_id: organizationId,
        contract_number: contractNumber,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [newContract] = await db('contracts').insert(contract).returning('*');
      
      logger.info(`Contract created: ${newContract.contract_number}`);
      return newContract;
    } catch (error) {
      logger.error('Error creating contract:', error);
      throw error;
    }
  }

  // Update a contract
  async updateContract(contractId, updateData, userId, organizationId) {
    try {
      const contract = await db('contracts')
        .where('id', contractId)
        .where('organization_id', organizationId)
        .first();

      if (!contract) {
        throw new Error('Contract not found');
      }

      const updatedContract = {
        ...updateData,
        updated_by: userId,
        updated_at: new Date()
      };

      const [result] = await db('contracts')
        .where('id', contractId)
        .update(updatedContract)
        .returning('*');

      logger.info(`Contract updated: ${result.contract_number}`);
      return result;
    } catch (error) {
      logger.error('Error updating contract:', error);
      throw error;
    }
  }

  // Delete a contract
  async deleteContract(contractId, organizationId) {
    try {
      const contract = await db('contracts')
        .where('id', contractId)
        .where('organization_id', organizationId)
        .first();

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Check if contract has associated tickets or invoices
      const hasTickets = await db('tickets')
        .where('contract_id', contractId)
        .first();

      if (hasTickets) {
        throw new Error('Cannot delete contract with associated tickets');
      }

      await db('contracts')
        .where('id', contractId)
        .del();

      logger.info(`Contract deleted: ${contract.contract_number}`);
      return { message: 'Contract deleted successfully' };
    } catch (error) {
      logger.error('Error deleting contract:', error);
      throw error;
    }
  }

  // Get contract metrics
  async getContractMetrics(contractId) {
    try {
      // Get ticket statistics
      const ticketStats = await db('tickets')
        .where('contract_id', contractId)
        .select(
          db.raw('COUNT(*) as total_tickets'),
          db.raw('COUNT(CASE WHEN status = "open" THEN 1 END) as open_tickets'),
          db.raw('COUNT(CASE WHEN status = "closed" THEN 1 END) as closed_tickets'),
          db.raw('COUNT(CASE WHEN priority = "high" THEN 1 END) as high_priority_tickets')
        )
        .first();

      // Get time tracking statistics
      const timeStats = await db('time_entries')
        .join('tickets', 'time_entries.ticket_id', 'tickets.id')
        .where('tickets.contract_id', contractId)
        .select(
          db.raw('SUM(time_entries.duration) as total_hours'),
          db.raw('COUNT(DISTINCT time_entries.ticket_id) as tickets_with_time')
        )
        .first();

      // Get billing statistics
      const billingStats = await db('invoices')
        .where('contract_id', contractId)
        .select(
          db.raw('COUNT(*) as total_invoices'),
          db.raw('SUM(total_amount) as total_billed'),
          db.raw('SUM(CASE WHEN status = "paid" THEN total_amount ELSE 0 END) as total_paid'),
          db.raw('SUM(CASE WHEN status = "overdue" THEN total_amount ELSE 0 END) as total_overdue')
        )
        .first();

      return {
        tickets: ticketStats || { total_tickets: 0, open_tickets: 0, closed_tickets: 0, high_priority_tickets: 0 },
        time_tracking: timeStats || { total_hours: 0, tickets_with_time: 0 },
        billing: billingStats || { total_invoices: 0, total_billed: 0, total_paid: 0, total_overdue: 0 }
      };
    } catch (error) {
      logger.error('Error fetching contract metrics:', error);
      return {
        tickets: { total_tickets: 0, open_tickets: 0, closed_tickets: 0, high_priority_tickets: 0 },
        time_tracking: { total_hours: 0, tickets_with_time: 0 },
        billing: { total_invoices: 0, total_billed: 0, total_paid: 0, total_overdue: 0 }
      };
    }
  }

  // Generate unique contract number
  async generateContractNumber(organizationId) {
    try {
      const year = new Date().getFullYear();
      const count = await db('contracts')
        .where('organization_id', organizationId)
        .whereRaw('YEAR(created_at) = ?', [year])
        .count('* as count')
        .first();

      const contractNumber = `CON-${year}-${String(count.count + 1).padStart(4, '0')}`;
      return contractNumber;
    } catch (error) {
      logger.error('Error generating contract number:', error);
      throw error;
    }
  }

  // Get contracts expiring soon
  async getExpiringContracts(organizationId, days = 30) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const contracts = await db('contracts')
        .select(
          'contracts.*',
          'clients.name as client_name',
          'clients.email as client_email'
        )
        .join('clients', 'contracts.client_id', 'clients.id')
        .where('contracts.organization_id', organizationId)
        .where('contracts.status', 'active')
        .where('contracts.end_date', '<=', expiryDate)
        .orderBy('contracts.end_date', 'asc');

      return contracts;
    } catch (error) {
      logger.error('Error fetching expiring contracts:', error);
      throw error;
    }
  }

  // Get contract summary for dashboard
  async getContractSummary(organizationId) {
    try {
      const summary = await db('contracts')
        .where('organization_id', organizationId)
        .select(
          db.raw('COUNT(*) as total_contracts'),
          db.raw('COUNT(CASE WHEN status = "active" THEN 1 END) as active_contracts'),
          db.raw('COUNT(CASE WHEN status = "expired" THEN 1 END) as expired_contracts'),
          db.raw('COUNT(CASE WHEN status = "draft" THEN 1 END) as draft_contracts'),
          db.raw('SUM(monthly_value) as total_monthly_value'),
          db.raw('COUNT(CASE WHEN end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as expiring_soon')
        )
        .first();

      return summary;
    } catch (error) {
      logger.error('Error fetching contract summary:', error);
      throw error;
    }
  }
}

module.exports = new ContractService(); 