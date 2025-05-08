const prisma = require('../config/database');

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name, description, level } = req.body;

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }

    // Create role
    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        level,
      },
    });

    res.status(201).json({
      message: 'Role created successfully',
      role: newRole,
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Server error while creating role' });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        level: 'asc',
      },
    });

    res.status(200).json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Server error while fetching roles' });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Server error while fetching role' });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const { name, description, level } = req.body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if name is already taken by another role
    if (name && name !== existingRole.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name },
      });

      if (nameExists) {
        return res.status(400).json({ message: 'Role with this name already exists' });
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: name || existingRole.name,
        description: description !== undefined ? description : existingRole.description,
        level: level !== undefined ? level : existingRole.level,
      },
    });

    res.status(200).json({
      message: 'Role updated successfully',
      role: updatedRole,
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error while updating role' });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: true,
      },
    });

    if (!existingRole) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if role has users
    if (existingRole.users.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role with assigned users. Reassign users first.' 
      });
    }

    // Delete role
    await prisma.role.delete({
      where: { id: roleId },
    });

    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Server error while deleting role' });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};

