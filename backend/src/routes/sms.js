const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// SMS Settings
router.get('/settings', smsController.getSMSSettings);
router.put('/settings', smsController.updateSMSSettings);
router.post('/settings/test', smsController.testSMSSettings);

// SMS Templates
router.get('/templates', smsController.getSMSTemplates);
router.post('/templates', smsController.saveSMSTemplate);
router.put('/templates/:templateId', smsController.saveSMSTemplate);
router.delete('/templates/:templateId', smsController.deleteSMSTemplate);

// Send SMS
router.post('/send', smsController.sendSMS);
router.post('/send/template', smsController.sendSMSTemplate);

// SMS Notifications
router.get('/notifications', smsController.getSMSNotifications);
router.get('/notifications/:notificationId/status', smsController.checkDeliveryStatus);

// User SMS Preferences
router.get('/preferences/user', smsController.getUserSMSPreferences);
router.post('/preferences/user', smsController.saveUserSMSPreferences);

// Client SMS Preferences
router.get('/preferences/client/:clientId', smsController.getClientSMSPreferences);
router.post('/preferences/client/:clientId', smsController.saveClientSMSPreferences);

// SMS Statistics
router.get('/statistics', smsController.getSMSStatistics);

module.exports = router; 