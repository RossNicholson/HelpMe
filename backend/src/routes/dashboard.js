const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router; 