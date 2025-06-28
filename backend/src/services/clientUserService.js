const db = require('../utils/database');
const logger = require('../utils/logger');

class ClientUserService {
  /**
   * Get all users for a specific client
   */
  async getClientUsers(clientId, organizationId) {
    try {
      const users = await db('client_users')
        .join('users', 'client_users.user_id', 'users.id')
        .where('client_users.client_id', clientId)
        .where('client_users.organization_id', organizationId)
        .select(
          'client_users.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'users.phone'
        );

      return users;
    } catch (error) {
      logger.error('Error getting client users:', error);
      throw error;
    }
  }

  /**
   * Get all clients for a specific user
   */
  async getUserClients(userId, organizationId) {
    try {
      const clients = await db('client_users')
        .join('clients', 'client_users.client_id', 'clients.id')
        .where('client_users.user_id', userId)
        .where('client_users.organization_id', organizationId)
        .select(
          'client_users.*',
          'clients.name as client_name',
          'clients.email as client_email'
        );

      return clients;
    } catch (error) {
      logger.error('Error getting user clients:', error);
      throw error;
    }
  }

  /**
   * Add a user to a client
   */
  async addUserToClient(clientId, userId, organizationId, permissions = {}) {
    try {
      // Check if relationship already exists
      const existing = await db('client_users')
        .where('client_id', clientId)
        .where('user_id', userId)
        .where('organization_id', organizationId)
        .first();

      if (existing) {
        throw new Error('User is already associated with this client');
      }

      // Verify client exists and belongs to organization
      const client = await db('clients')
        .where('id', clientId)
        .where('organization_id', organizationId)
        .first();

      if (!client) {
        throw new Error('Client not found or does not belong to organization');
      }

      // Verify user exists and belongs to organization
      const user = await db('user_organizations')
        .where('user_id', userId)
        .where('organization_id', organizationId)
        .first();

      if (!user) {
        throw new Error('User not found or does not belong to organization');
      }

      const [clientUser] = await db('client_users')
        .insert({
          client_id: clientId,
          user_id: userId,
          organization_id: organizationId,
          can_view_tickets: permissions.can_view_tickets !== false,
          can_create_tickets: permissions.can_create_tickets !== false,
          can_edit_tickets: permissions.can_edit_tickets !== false,
          can_delete_tickets: permissions.can_delete_tickets !== false,
          can_view_all_tickets: permissions.can_view_all_tickets !== false,
          is_primary_contact: permissions.is_primary_contact || false,
          is_active: true
        })
        .returning('*');

      return clientUser;
    } catch (error) {
      logger.error('Error adding user to client:', error);
      throw error;
    }
  }

  /**
   * Update user permissions for a client
   */
  async updateUserClientPermissions(clientId, userId, organizationId, permissions) {
    try {
      const [updated] = await db('client_users')
        .where('client_id', clientId)
        .where('user_id', userId)
        .where('organization_id', organizationId)
        .update({
          can_view_tickets: permissions.can_view_tickets,
          can_create_tickets: permissions.can_create_tickets,
          can_edit_tickets: permissions.can_edit_tickets,
          can_delete_tickets: permissions.can_delete_tickets,
          can_view_all_tickets: permissions.can_view_all_tickets,
          is_primary_contact: permissions.is_primary_contact,
          updated_at: new Date()
        })
        .returning('*');

      if (!updated) {
        throw new Error('Client user relationship not found');
      }

      return updated;
    } catch (error) {
      logger.error('Error updating user client permissions:', error);
      throw error;
    }
  }

  /**
   * Remove a user from a client
   */
  async removeUserFromClient(clientId, userId, organizationId) {
    try {
      const deleted = await db('client_users')
        .where('client_id', clientId)
        .where('user_id', userId)
        .where('organization_id', organizationId)
        .del();

      if (!deleted) {
        throw new Error('Client user relationship not found');
      }

      return true;
    } catch (error) {
      logger.error('Error removing user from client:', error);
      throw error;
    }
  }

  /**
   * Get primary contact for a client
   */
  async getClientPrimaryContact(clientId, organizationId) {
    try {
      const primaryContact = await db('client_users')
        .join('users', 'client_users.user_id', 'users.id')
        .where('client_users.client_id', clientId)
        .where('client_users.organization_id', organizationId)
        .where('client_users.is_primary_contact', true)
        .where('client_users.is_active', true)
        .select(
          'client_users.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'users.phone'
        )
        .first();

      return primaryContact;
    } catch (error) {
      logger.error('Error getting client primary contact:', error);
      throw error;
    }
  }

  /**
   * Check if user can view all tickets for a client
   */
  async canUserViewAllTickets(userId, clientId, organizationId) {
    try {
      const clientUser = await db('client_users')
        .where('client_id', clientId)
        .where('user_id', userId)
        .where('organization_id', organizationId)
        .where('is_active', true)
        .first();

      return clientUser ? clientUser.can_view_all_tickets : false;
    } catch (error) {
      logger.error('Error checking user ticket permissions:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a specific client
   */
  async hasUserClientAccess(userId, clientId, organizationId) {
    try {
      const clientUser = await db('client_users')
        .where('client_id', clientId)
        .where('user_id', userId)
        .where('organization_id', organizationId)
        .where('is_active', true)
        .first();

      return !!clientUser;
    } catch (error) {
      logger.error('Error checking user client access:', error);
      return false;
    }
  }
}

module.exports = new ClientUserService(); 