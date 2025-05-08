const express = require('express');
const { 
  createLead, 
  getAllLeads, 
  getLeadById, 
  updateLead, 
  updateLeadStatus, 
  deleteLead, 
  getLeadStatusLogs 
} = require('../controllers/leadController');
const { authenticate, isAdmin, canAccessLead } = require('../middleware/auth');
const { validateLeadCreation, validateLeadStatusUpdate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes accessible to all authenticated users
router.get('/', getAllLeads);

// Routes that require specific lead access
router.get('/:id', canAccessLead, getLeadById);
router.put('/:id', canAccessLead, updateLead);
router.patch('/:id/status', canAccessLead, validateLeadStatusUpdate, updateLeadStatus);
router.get('/:id/status-logs', canAccessLead, getLeadStatusLogs);

// Admin-only routes
router.post('/', validateLeadCreation, createLead);
router.delete('/:id', isAdmin, deleteLead);

module.exports = router;

