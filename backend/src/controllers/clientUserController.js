const clientUserService = require('../services/clientUserService');
const logger = require('../utils/logger');

/**
 * Get all users for a specific client
 */
const getClientUsers = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { organization_id } = req.user;

    const users = await clientUserService.getClientUsers(clientId, organization_id);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error getting client users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client users',
      error: error.message
    });
  }
};

/**
 * Get all clients for the current user
 */
const getUserClients = async (req, res) => {
  try {
    const { id: userId, organization_id } = req.user;

    const clients = await clientUserService.getUserClients(userId, organization_id);
    
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    logger.error('Error getting user clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user clients',
      error: error.message
    });
  }
};

/**
 * Add a user to a client
 */
const addUserToClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { userId, role, permissions, notes } = req.body;
    const { organization_id } = req.user;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const clientUser = await clientUserService.addUserToClient(
      userId,
      clientId,
      organization_id,
      role,
      permissions
    );

    res.status(201).json({
      success: true,
      message: 'User added to client successfully',
      data: clientUser
    });
  } catch (error) {
    logger.error('Error adding user to client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add user to client',
      error: error.message
    });
  }
};

/**
 * Update client user role and permissions
 */
const updateClientUser = async (req, res) => {
  try {
    const { clientUserId } = req.params;
    const { role, permissions, can_create_tickets, can_view_all_tickets, notes, is_active } = req.body;
    const { organization_id } = req.user;

    const updates = {};
    if (role) updates.role = role;
    if (permissions) updates.permissions = permissions;
    if (typeof can_create_tickets === 'boolean') updates.can_create_tickets = can_create_tickets;
    if (typeof can_view_all_tickets === 'boolean') updates.can_view_all_tickets = can_view_all_tickets;
    if (notes !== undefined) updates.notes = notes;
    if (typeof is_active === 'boolean') updates.is_active = is_active;

    const updated = await clientUserService.updateClientUser(clientUserId, organization_id, updates);

    res.json({
      success: true,
      message: 'Client user updated successfully',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating client user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client user',
      error: error.message
    });
  }
};

/**
 * Remove user from client
 */
const removeUserFromClient = async (req, res) => {
  try {
    const { clientId, userId } = req.params;
    const { organization_id } = req.user;

    const removed = await clientUserService.removeUserFromClient(userId, clientId, organization_id);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'User not found in client'
      });
    }

    res.json({
      success: true,
      message: 'User removed from client successfully'
    });
  } catch (error) {
    logger.error('Error removing user from client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from client',
      error: error.message
    });
  }
};

/**
 * Get primary contact for a client
 */
const getClientPrimaryContact = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { organization_id } = req.user;

    const primaryContact = await clientUserService.getClientPrimaryContact(clientId, organization_id);

    res.json({
      success: true,
      data: primaryContact
    });
  } catch (error) {
    logger.error('Error getting client primary contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client primary contact',
      error: error.message
    });
  }
};

/**
 * Check user permissions for a client
 */
const checkUserPermissions = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { id: userId, organization_id } = req.user;

    const [canCreateTickets, canViewAllTickets] = await Promise.all([
      clientUserService.canUserCreateTickets(userId, clientId, organization_id),
      clientUserService.canUserViewAllTickets(userId, clientId, organization_id)
    ]);

    res.json({
      success: true,
      data: {
        can_create_tickets: canCreateTickets,
        can_view_all_tickets: canViewAllTickets
      }
    });
  } catch (error) {
    logger.error('Error checking user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user permissions',
      error: error.message
    });
  }
};

module.exports = {
  getClientUsers,
  getUserClients,
  addUserToClient,
  updateClientUser,
  removeUserFromClient,
  getClientPrimaryContact,
  checkUserPermissions
}; 