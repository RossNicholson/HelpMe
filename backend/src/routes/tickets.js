const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Ticket CRUD operations
router.get('/organizations/:organizationId/tickets', ticketController.getTickets);
router.get('/tickets/:id', ticketController.getTicket);
router.post('/tickets', ticketController.createTicket);
router.put('/tickets/:id', ticketController.updateTicket);

// Ticket comments
router.post('/tickets/:ticketId/comments', ticketController.addComment);

// Ticket statistics
router.get('/organizations/:organizationId/ticket-stats', ticketController.getTicketStats);

module.exports = router; 