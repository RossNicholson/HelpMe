const express = require('express');
const router = express.Router();
const { protect, authorize, authorizeOrganization } = require('../middleware/auth');
const {
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
} = require('../controllers/contractController');

// Apply organization authorization middleware to all routes
router.use(authorizeOrganization);

// Get contract summary for dashboard
router.get('/summary', protect, authorize('admin', 'manager'), getContractSummary);

// Get expiring contracts
router.get('/expiring', protect, authorize('admin', 'manager'), getExpiringContracts);

// Get contracts by client
router.get('/client/:clientId', protect, authorize('admin', 'manager', 'technician'), getContractsByClient);

// Get all contracts
router.get('/', protect, authorize('admin', 'manager', 'technician'), getContracts);

// Get a single contract
router.get('/:id', protect, authorize('admin', 'manager', 'technician'), getContractById);

// Get contract metrics
router.get('/:id/metrics', protect, authorize('admin', 'manager'), getContractMetrics);

// Create a new contract
router.post('/', protect, authorize('admin', 'manager'), createContract);

// Update a contract
router.put('/:id', protect, authorize('admin', 'manager'), updateContract);

// Update contract status
router.patch('/:id/status', protect, authorize('admin', 'manager'), updateContractStatus);

// Delete a contract
router.delete('/:id', protect, authorize('admin'), deleteContract);

module.exports = router; 