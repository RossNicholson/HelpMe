const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getClientUsers,
  getUserClients,
  addUserToClient,
  updateClientUser,
  removeUserFromClient,
  getClientPrimaryContact,
  checkUserPermissions
} = require('../controllers/clientUserController');

// All routes require authentication
router.use(protect);

// Get all users for a specific client (admin/technician only)
router.get('/clients/:clientId/users', authorize('admin', 'technician'), getClientUsers);

// Get all clients for the current user
router.get('/my-clients', getUserClients);

// Add a user to a client (admin/technician only)
router.post('/clients/:clientId/users', authorize('admin', 'technician'), addUserToClient);

// Update client user role and permissions (admin/technician only)
router.put('/client-users/:clientUserId', authorize('admin', 'technician'), updateClientUser);

// Remove user from client (admin/technician only)
router.delete('/clients/:clientId/users/:userId', authorize('admin', 'technician'), removeUserFromClient);

// Get primary contact for a client
router.get('/clients/:clientId/primary-contact', getClientPrimaryContact);

// Check user permissions for a client
router.get('/clients/:clientId/permissions', checkUserPermissions);

module.exports = router; 