const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user registration
const validateUserRegistration = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('roleId').isInt().withMessage('Valid role ID is required'),
  body('parentId').optional().isInt().withMessage('Parent ID must be an integer'),
  handleValidationErrors,
];

// Validation rules for user login
const validateUserLogin = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Validation rules for role creation
const validateRoleCreation = [
  body('name').notEmpty().withMessage('Role name is required'),
  body('level').isInt({ min: 0 }).withMessage('Level must be a non-negative integer'),
  body('description').optional(),
  handleValidationErrors,
];

// Validation rules for lead creation
const validateLeadCreation = [
  body('name').notEmpty().withMessage('Lead name is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email address'),
  body('phone').optional(),
  body('company').optional(),
  body('description').optional(),
  body('status').optional().isIn([
    'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  ]).withMessage('Invalid lead status'),
  body('assignedToId').optional().isInt().withMessage('Assigned user ID must be an integer'),
  handleValidationErrors,
];

// Validation rules for lead status update
const validateLeadStatusUpdate = [
  param('id').isInt().withMessage('Lead ID must be an integer'),
  body('status').isIn([
    'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  ]).withMessage('Invalid lead status'),
  body('notes').optional(),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateRoleCreation,
  validateLeadCreation,
  validateLeadStatusUpdate,
};

