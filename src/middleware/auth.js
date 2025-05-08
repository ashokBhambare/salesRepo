const { verifyToken } = require('../config/jwt');
const prisma = require('../config/database');

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    // Verify token
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: true,
        parent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roleId: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
};

// Middleware to check if user has admin role
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role.name !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware to check if user has specific role
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role.name)) {
      return res.status(403).json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
    }
    next();
  };
};

// Middleware to check if user has access to a specific lead
const canAccessLead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const leadId = parseInt(req.params.id);
    
    // Admin can access all leads
    if (req.user.role.name === 'Admin') {
      return next();
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    // Check if user is assigned to this lead
    if (lead.assignedToId === userId) {
      return next();
    }

    // Check if user is a parent of the user assigned to this lead
    // This requires recursive checking up the hierarchy
    let currentUser = lead.assignedTo;
    while (currentUser && currentUser.parentId) {
      if (currentUser.parentId === userId) {
        return next();
      }
      
      // Get the parent user
      currentUser = await prisma.user.findUnique({
        where: { id: currentUser.parentId },
      });
    }

    return res.status(403).json({ message: 'Access denied. You do not have permission to access this lead.' });
  } catch (error) {
    console.error('Lead access check error:', error);
    return res.status(500).json({ message: 'Server error during access check.' });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  hasRole,
  canAccessLead,
};

