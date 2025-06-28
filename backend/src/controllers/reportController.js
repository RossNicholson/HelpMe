const reportService = require('../services/reportService');
const logger = require('../utils/logger');

class ReportController {
  async getTicketAnalytics(req, res) {
    try {
      const data = await reportService.getTicketAnalytics(req.user.organization_id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error in getTicketAnalytics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSLACompliance(req, res) {
    try {
      const data = await reportService.getSLACompliance(req.user.organization_id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error in getSLACompliance:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getTimeTrackingStats(req, res) {
    try {
      const data = await reportService.getTimeTrackingStats(req.user.organization_id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error in getTimeTrackingStats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBillingStats(req, res) {
    try {
      const data = await reportService.getBillingStats(req.user.organization_id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error in getBillingStats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getClientPerformance(req, res) {
    try {
      const data = await reportService.getClientPerformance(req.user.organization_id, req.query);
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Error in getClientPerformance:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ReportController(); 