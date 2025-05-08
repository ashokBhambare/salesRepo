const prisma = require('../config/database');

// Create a new lead
const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, description, status, assignedToId } = req.body;
    const createdById = req.user.id;

    // If assignedToId is provided, check if the user exists and is a Sales Manager
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        include: { role: true },
      });

      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned user not found' });
      }

      if (assignedUser.role.name !== 'SM') {
        return res.status(400).json({ message: 'Leads can only be assigned to Sales Managers' });
      }
    }

    // Create lead
    const newLead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company,
        description,
        status: status || 'new',
        assignedToId,
        createdById,
      },
    });

    // Create initial status log
    await prisma.leadStatusLog.create({
      data: {
        leadId: newLead.id,
        userId: createdById,
        oldStatus: null,
        newStatus: newLead.status,
        notes: 'Lead created',
      },
    });

    res.status(201).json({
      message: 'Lead created successfully',
      lead: newLead,
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error while creating lead' });
  }
};

// Get all leads (filtered by user role and hierarchy)
const getAllLeads = async (req, res) => {
  try {
    const user = req.user;
    let leads = [];

    // Admin can see all leads
    if (user.role.name === 'Admin') {
      leads = await prisma.lead.findMany({
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          statusLogs: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } 
    // Sales Manager can see only their assigned leads
    else if (user.role.name === 'SM') {
      leads = await prisma.lead.findMany({
        where: {
          assignedToId: user.id,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          statusLogs: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } 
    // Parent roles (RSM, ZSM) can see leads assigned to their children recursively
    else {
      // Function to recursively get all children IDs
      const getChildrenIdsRecursively = async (parentId) => {
        const children = await prisma.user.findMany({
          where: { parentId },
          select: { id: true },
        });

        let childrenIds = children.map(child => child.id);
        
        for (const child of children) {
          const grandchildrenIds = await getChildrenIdsRecursively(child.id);
          childrenIds = [...childrenIds, ...grandchildrenIds];
        }

        return childrenIds;
      };

      // Get all children IDs
      const childrenIds = await getChildrenIdsRecursively(user.id);

      // Get leads assigned to any of the children
      leads = await prisma.lead.findMany({
        where: {
          assignedToId: {
            in: childrenIds,
          },
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          statusLogs: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }

    res.status(200).json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Server error while fetching leads' });
  }
};

// Get lead by ID
const getLeadById = async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        statusLogs: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: 'Server error while fetching lead' });
  }
};

// Update lead
const updateLead = async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { name, email, phone, company, description, assignedToId } = req.body;

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // If assignedToId is provided, check if the user exists and is a Sales Manager
    if (assignedToId && assignedToId !== existingLead.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId },
        include: { role: true },
      });

      if (!assignedUser) {
        return res.status(400).json({ message: 'Assigned user not found' });
      }

      if (assignedUser.role.name !== 'SM') {
        return res.status(400).json({ message: 'Leads can only be assigned to Sales Managers' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (description !== undefined) updateData.description = description;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Lead updated successfully',
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Server error while updating lead' });
  }
};

// Update lead status
const updateLeadStatus = async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const { status, notes } = req.body;
    const userId = req.user.id;

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Create status log
    await prisma.leadStatusLog.create({
      data: {
        leadId,
        userId,
        oldStatus: existingLead.status,
        newStatus: status,
        notes,
      },
    });

    // Update lead status
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { status },
      include: {
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        statusLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: 'Lead status updated successfully',
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({ message: 'Server error while updating lead status' });
  }
};

// Delete lead
const deleteLead = async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Delete lead status logs first (due to foreign key constraints)
    await prisma.leadStatusLog.deleteMany({
      where: { leadId },
    });

    // Delete lead
    await prisma.lead.delete({
      where: { id: leadId },
    });

    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error while deleting lead' });
  }
};

// Get lead status logs
const getLeadStatusLogs = async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Get status logs
    const statusLogs = await prisma.leadStatusLog.findMany({
      where: { leadId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ statusLogs });
  } catch (error) {
    console.error('Get lead status logs error:', error);
    res.status(500).json({ message: 'Server error while fetching lead status logs' });
  }
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  deleteLead,
  getLeadStatusLogs,
};

