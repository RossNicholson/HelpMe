const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Ticket CRUD operations
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicket);
router.post('/', ticketController.createTicket);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

// Ticket comments
router.post('/:ticketId/comments', ticketController.addComment);

// Ticket status and assignment
router.patch('/:id/status', ticketController.updateStatus);
router.patch('/:id/assign', ticketController.assignTicket);

// Ticket statistics
router.get('/stats/organizations/:organizationId', ticketController.getTicketStats);

module.exports = router; 