const bcrypt = require('bcrypt');
const prisma = require('../config/database');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        roleId: true,
        parentId: true,
        role: true,
        parent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        roleId: true,
        parentId: true,
        role: true,
        parent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        children: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, email, roleId, parentId, isActive, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if role exists if roleId is provided
    let role = null;
    if (roleId && roleId !== existingUser.roleId) {
      role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }
    }

    // Check if parent exists if parentId is provided
    if (parentId && parentId !== existingUser.parentId) {
      const parent = await prisma.user.findUnique({
        where: { id: parentId },
        include: { role: true },
      });

      if (!parent) {
        return res.status(400).json({ message: 'Invalid parent user ID' });
      }

      // Ensure parent's role level is lower than the user's role level (lower level number = higher in hierarchy)
      const userRole = role || existingUser.role;
      if (parent.role.level >= userRole.level) {
        return res.status(400).json({ 
          message: 'Invalid hierarchy. Parent must have a higher role in the hierarchy.' 
        });
      }

      // Prevent circular references
      if (parentId === userId) {
        return res.status(400).json({ message: 'User cannot be their own parent' });
      }

      // Check if this would create a circular reference in the hierarchy
      let currentParent = parent;
      while (currentParent && currentParent.parentId) {
        if (currentParent.parentId === userId) {
          return res.status(400).json({ 
            message: 'This would create a circular reference in the hierarchy' 
          });
        }
        
        currentParent = await prisma.user.findUnique({
          where: { id: currentParent.parentId },
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        roleId: true,
        parentId: true,
        role: true,
        parent: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        children: true,
        assignedLeads: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has children
    if (existingUser.children.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with child users. Reassign children first.' 
      });
    }

    // Check if user has assigned leads
    if (existingUser.assignedLeads.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with assigned leads. Reassign leads first.' 
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

// Get user hierarchy (all users under this user)
const getUserHierarchy = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Function to recursively get all children
    const getChildrenRecursively = async (parentId) => {
      const children = await prisma.user.findMany({
        where: { parentId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          roleId: true,
          role: true,
        },
      });

      const result = [];
      for (const child of children) {
        const childWithChildren = { ...child, children: [] };
        childWithChildren.children = await getChildrenRecursively(child.id);
        result.push(childWithChildren);
      }

      return result;
    };

    // Get the hierarchy
    const hierarchy = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roleId: user.roleId,
      role: user.role,
      children: await getChildrenRecursively(user.id),
    };

    res.status(200).json({ hierarchy });
  } catch (error) {
    console.error('Get user hierarchy error:', error);
    res.status(500).json({ message: 'Server error while fetching user hierarchy' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserHierarchy,
};

