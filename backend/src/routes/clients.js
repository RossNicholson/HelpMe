const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../utils/database');
const clientUserController = require('../controllers/clientUserController');

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get('/', protect, async (req, res) => {
  try {
    const clients = await db('clients')
      .select(
        'clients.*',
        'primary_contact.id as primary_contact_id',
        'primary_contact.first_name as primary_contact_first_name',
        'primary_contact.last_name as primary_contact_last_name',
        'primary_contact.email as primary_contact_email',
        'primary_contact.phone as primary_contact_phone'
      )
      .leftJoin('users as primary_contact', 'clients.primary_contact_id', 'primary_contact.id')
      .where('clients.organization_id', req.user.organization_id)
      .orderBy('clients.name');
    
    // Transform the data to include primary_contact object
    const transformedClients = clients.map(client => ({
      ...client,
      primary_contact: client.primary_contact_id ? {
        id: client.primary_contact_id,
        first_name: client.primary_contact_first_name,
        last_name: client.primary_contact_last_name,
        email: client.primary_contact_email,
        phone: client.primary_contact_phone
      } : null
    }));
    
    res.json({
      success: true,
      data: transformedClients
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch clients' 
    });
  }
});

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const client = await db('clients')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .first();
    
    if (!client) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch client' 
    });
  }
});

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *     responses:
 *       201:
 *         description: Client created successfully
 */
router.post('/', protect, async (req, res) => {
  try {
    const { 
      name, 
      company_name,
      website,
      timezone,
      address, 
      notes,
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_phone
    } = req.body;
    
    if (!name || !contact_first_name || !contact_last_name || !contact_email) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer name, primary contact first name, last name, and email are required' 
      });
    }
    
    // Prepare client data with primary contact information
    const clientData = {
      name,
      company_name,
      website,
      timezone: timezone || 'UTC',
      notes,
      organization_id: req.user.organization_id,
      // Store primary contact information directly in the client record
      primary_contact_first_name: contact_first_name,
      primary_contact_last_name: contact_last_name,
      primary_contact_email: contact_email,
      primary_contact_phone: contact_phone
    };
    
    // Handle address field - convert string to JSON if provided
    if (address && typeof address === 'string') {
      try {
        clientData.address = JSON.parse(address);
      } catch (e) {
        // If it's not valid JSON, store as a simple object
        clientData.address = { text: address };
      }
    } else if (address) {
      clientData.address = address;
    }
    
    // Create the client
    const [client] = await db('clients').insert(clientData).returning('*');
    
    // Return the client with primary contact information
    const clientWithContact = {
      ...client,
      primary_contact: {
        first_name: client.primary_contact_first_name,
        last_name: client.primary_contact_last_name,
        email: client.primary_contact_email,
        phone: client.primary_contact_phone
      }
    };
    
    res.status(201).json({
      success: true,
      data: clientWithContact
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create client',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client updated successfully
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { 
      name, 
      company_name,
      website,
      timezone,
      address, 
      notes,
      contact_first_name,
      contact_last_name,
      contact_email,
      contact_phone
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer name is required' 
      });
    }
    
    // Use a transaction to update both client and primary contact
    const result = await db.transaction(async (trx) => {
      // Get the current client
      const currentClient = await trx('clients')
        .where({ id: req.params.id, organization_id: req.user.organization_id })
        .first();
      
      if (!currentClient) {
        throw new Error('Client not found');
      }
      
      // Prepare client update data
      const clientUpdateData = {
        name,
        company_name,
        website,
        timezone: timezone || 'UTC',
        notes
      };
      
      // Handle address field - convert string to JSON if provided
      if (address && typeof address === 'string') {
        try {
          clientUpdateData.address = JSON.parse(address);
        } catch (e) {
          // If it's not valid JSON, store as a simple object
          clientUpdateData.address = { text: address };
        }
      } else if (address) {
        clientUpdateData.address = address;
      }
      
      // Update the client
      const [updatedClient] = await trx('clients')
        .where('id', req.params.id)
        .update(clientUpdateData)
        .returning('*');
      
      // Update primary contact if provided
      if (contact_first_name && contact_last_name && contact_email && currentClient.primary_contact_id) {
        await trx('users')
          .where('id', currentClient.primary_contact_id)
          .update({
            first_name: contact_first_name,
            last_name: contact_last_name,
            email: contact_email,
            phone: contact_phone
          });
      }
      
      // Get the updated client with primary contact information
      const clientWithContact = await trx('clients')
        .select(
          'clients.*',
          'primary_contact.id as primary_contact_id',
          'primary_contact.first_name as primary_contact_first_name',
          'primary_contact.last_name as primary_contact_last_name',
          'primary_contact.email as primary_contact_email',
          'primary_contact.phone as primary_contact_phone'
        )
        .leftJoin('users as primary_contact', 'clients.primary_contact_id', 'primary_contact.id')
        .where('clients.id', req.params.id)
        .first();
      
      // Transform the data to include primary_contact object
      const transformedClient = {
        ...clientWithContact,
        primary_contact: clientWithContact.primary_contact_id ? {
          id: clientWithContact.primary_contact_id,
          first_name: clientWithContact.primary_contact_first_name,
          last_name: clientWithContact.primary_contact_last_name,
          email: clientWithContact.primary_contact_email,
          phone: clientWithContact.primary_contact_phone
        } : null
      };
      
      return transformedClient;
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.message === 'Client not found') {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to update client',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client deleted successfully
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await db('clients')
      .where({ id: req.params.id, organization_id: req.user.organization_id })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Client deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete client' 
    });
  }
});

router.get('/:clientId/users', protect, clientUserController.getClientUsers);

module.exports = router; 