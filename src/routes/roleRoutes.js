const express = require('express');
const { 
  createRole, 
  getAllRoles, 
  getRoleById, 
  updateRole, 
  deleteRole 
} = require('../controllers/roleController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { validateRoleCreation } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin-only routes
router.post('/', isAdmin, validateRoleCreation, createRole);
router.put('/:id', isAdmin, updateRole);
router.delete('/:id', isAdmin, deleteRole);

// Routes accessible to all authenticated users
router.get('/', getAllRoles);
router.get('/:id', getRoleById);

module.exports = router;

