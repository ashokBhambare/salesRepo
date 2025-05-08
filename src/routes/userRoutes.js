const express = require('express');
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserHierarchy 
} = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin-only routes
router.get('/', isAdmin, getAllUsers);
router.delete('/:id', isAdmin, deleteUser);

// Routes accessible to all authenticated users
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.get('/:id/hierarchy', getUserHierarchy);

module.exports = router;

