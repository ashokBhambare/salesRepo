const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'System administrator with full access',
        level: 0,
      },
    });

    const zsmRole = await prisma.role.upsert({
      where: { name: 'ZSM' },
      update: {},
      create: {
        name: 'ZSM',
        description: 'Zonal Sales Manager',
        level: 1,
      },
    });

    const rsmRole = await prisma.role.upsert({
      where: { name: 'RSM' },
      update: {},
      create: {
        name: 'RSM',
        description: 'Regional Sales Manager',
        level: 2,
      },
    });

    const smRole = await prisma.role.upsert({
      where: { name: 'SM' },
      update: {},
      create: {
        name: 'SM',
        description: 'Sales Manager',
        level: 3,
      },
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        roleId: adminRole.id,
      },
    });

    // Create ZSM user
    const zsmUser = await prisma.user.upsert({
      where: { email: 'zsm@example.com' },
      update: {},
      create: {
        email: 'zsm@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Zonal',
        lastName: 'Manager',
        roleId: zsmRole.id,
        parentId: adminUser.id,
      },
    });

    // Create RSM users
    const rsm1User = await prisma.user.upsert({
      where: { email: 'rsm1@example.com' },
      update: {},
      create: {
        email: 'rsm1@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Regional',
        lastName: 'Manager North',
        roleId: rsmRole.id,
        parentId: zsmUser.id,
      },
    });

    const rsm2User = await prisma.user.upsert({
      where: { email: 'rsm2@example.com' },
      update: {},
      create: {
        email: 'rsm2@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Regional',
        lastName: 'Manager South',
        roleId: rsmRole.id,
        parentId: zsmUser.id,
      },
    });

    // Create SM users
    const sm1User = await prisma.user.upsert({
      where: { email: 'sm1@example.com' },
      update: {},
      create: {
        email: 'sm1@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Sales',
        lastName: 'Manager 1',
        roleId: smRole.id,
        parentId: rsm1User.id,
      },
    });

    const sm2User = await prisma.user.upsert({
      where: { email: 'sm2@example.com' },
      update: {},
      create: {
        email: 'sm2@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Sales',
        lastName: 'Manager 2',
        roleId: smRole.id,
        parentId: rsm1User.id,
      },
    });

    const sm3User = await prisma.user.upsert({
      where: { email: 'sm3@example.com' },
      update: {},
      create: {
        email: 'sm3@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Sales',
        lastName: 'Manager 3',
        roleId: smRole.id,
        parentId: rsm2User.id,
      },
    });

    // Create sample leads
    const lead1 = await prisma.lead.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '123-456-7890',
        company: 'Acme Corp',
        description: 'Interested in our enterprise solution',
        status: 'new',
        assignedToId: sm1User.id,
        createdById: adminUser.id,
      },
    });

    const lead2 = await prisma.lead.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'TechStart Inc',
        email: 'info@techstart.com',
        phone: '987-654-3210',
        company: 'TechStart',
        description: 'Looking for sales automation tools',
        status: 'contacted',
        assignedToId: sm2User.id,
        createdById: adminUser.id,
      },
    });

    const lead3 = await prisma.lead.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Global Services Ltd',
        email: 'sales@globalservices.com',
        phone: '555-123-4567',
        company: 'Global Services',
        description: 'Needs a custom solution for their sales team',
        status: 'qualified',
        assignedToId: sm3User.id,
        createdById: adminUser.id,
      },
    });

    // Create lead status logs
    await prisma.leadStatusLog.createMany({
      data: [
        {
          leadId: lead1.id,
          userId: sm1User.id,
          oldStatus: null,
          newStatus: 'new',
          notes: 'Lead created',
        },
        {
          leadId: lead2.id,
          userId: sm2User.id,
          oldStatus: null,
          newStatus: 'new',
          notes: 'Lead created',
        },
        {
          leadId: lead2.id,
          userId: sm2User.id,
          oldStatus: 'new',
          newStatus: 'contacted',
          notes: 'Initial contact made via email',
        },
        {
          leadId: lead3.id,
          userId: sm3User.id,
          oldStatus: null,
          newStatus: 'new',
          notes: 'Lead created',
        },
        {
          leadId: lead3.id,
          userId: sm3User.id,
          oldStatus: 'new',
          newStatus: 'contacted',
          notes: 'Called and discussed requirements',
        },
        {
          leadId: lead3.id,
          userId: sm3User.id,
          oldStatus: 'contacted',
          newStatus: 'qualified',
          notes: 'Confirmed budget and timeline',
        },
      ],
    });

    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

