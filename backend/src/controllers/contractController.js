const contractService = require('../services/contractService');
const logger = require('../utils/logger');

// Get all contracts
const getContracts = async (req, res) => {
  try {
    const { organizationId } = req;
    const filters = {
      status: req.query.status,
      type: req.query.type,
      client_id: req.query.client_id,
      search: req.query.search
    };

    const contracts = await contractService.getContracts(organizationId, filters);
    
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    logger.error('Error in getContracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts'
    });
  }
};

// Get a single contract
const getContractById = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const contract = await contractService.getContractById(id, organizationId);
    
    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    logger.error('Error in getContractById:', error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract'
    });
  }
};

// Create a new contract
const createContract = async (req, res) => {
  try {
    const { organizationId } = req;
    const { userId } = req.user;
    const contractData = req.body;

    // Validate required fields
    const requiredFields = ['client_id', 'name', 'type', 'start_date', 'end_date'];
    for (const field of requiredFields) {
      if (!contractData[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }

    // Validate dates
    const startDate = new Date(contractData.start_date);
    const endDate = new Date(contractData.end_date);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }

    const contract = await contractService.createContract(contractData, userId, organizationId);
    
    res.status(201).json({
      success: true,
      data: contract,
      message: 'Contract created successfully'
    });
  } catch (error) {
    logger.error('Error in createContract:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create contract'
    });
  }
};

// Update a contract
const updateContract = async (req, res) => {
  try {
    const { organizationId } = req;
    const { userId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Validate dates if provided
    if (updateData.start_date && updateData.end_date) {
      const startDate = new Date(updateData.start_date);
      const endDate = new Date(updateData.end_date);
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }
    }

    const contract = await contractService.updateContract(id, updateData, userId, organizationId);
    
    res.json({
      success: true,
      data: contract,
      message: 'Contract updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateContract:', error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update contract'
    });
  }
};

// Delete a contract
const deleteContract = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const result = await contractService.deleteContract(id, organizationId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error in deleteContract:', error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    if (error.message === 'Cannot delete contract with associated tickets') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete contract with associated tickets'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete contract'
    });
  }
};

// Get contract summary for dashboard
const getContractSummary = async (req, res) => {
  try {
    const { organizationId } = req;

    const summary = await contractService.getContractSummary(organizationId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error in getContractSummary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract summary'
    });
  }
};

// Get expiring contracts
const getExpiringContracts = async (req, res) => {
  try {
    const { organizationId } = req;
    const days = parseInt(req.query.days) || 30;

    const contracts = await contractService.getExpiringContracts(organizationId, days);
    
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    logger.error('Error in getExpiringContracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expiring contracts'
    });
  }
};

// Get contract metrics
const getContractMetrics = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    // Verify contract belongs to organization
    const contract = await contractService.getContractById(id, organizationId);
    const metrics = await contractService.getContractMetrics(id);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error in getContractMetrics:', error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract metrics'
    });
  }
};

// Update contract status
const updateContractStatus = async (req, res) => {
  try {
    const { organizationId } = req;
    const { userId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'active', 'expired', 'terminated', 'renewed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: draft, active, expired, terminated, renewed'
      });
    }

    const contract = await contractService.updateContract(id, { status }, userId, organizationId);
    
    res.json({
      success: true,
      data: contract,
      message: 'Contract status updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateContractStatus:', error);
    if (error.message === 'Contract not found') {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update contract status'
    });
  }
};

// Get contracts by client
const getContractsByClient = async (req, res) => {
  try {
    const { organizationId } = req;
    const { clientId } = req.params;

    const contracts = await contractService.getContracts(organizationId, { client_id: clientId });
    
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    logger.error('Error in getContractsByClient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client contracts'
    });
  }
};

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getContractSummary,
  getExpiringContracts,
  getContractMetrics,
  updateContractStatus,
  getContractsByClient
}; 