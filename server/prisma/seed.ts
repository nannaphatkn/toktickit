import { PrismaClient, Priority, TicketStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

const categories = [
  { name: 'Account and Access', description: 'Password resets, access requests, permission elevation' },
  { name: 'Hardware', description: 'Issues with laptops, monitors, peripherals, workstations' },
  { name: 'Network', description: 'Wi-Fi, VPN, firewall, internet connectivity' },
  { name: 'Software', description: 'Installation, licensing, application crashes, OS updates' },
  { name: 'General IT Support', description: 'General inquiries, IT guidance, setup assistance' },
];

const relatedSystems = [
  { name: 'Corporate Laptop' },
  { name: 'Email/Outlook' },
  { name: 'Campus Wi-Fi' },
  { name: 'Corporate VPN' },
  { name: 'ERP System' },
  { name: 'Desktop Monitor/Peripherals' },
  { name: 'Active Directory / Azure AD' },
];

const users = [
  // Requesters (4 active, 1 inactive)
  {
    email: 'jennifer.anderson@toktickit.com',
    fullName: 'Jennifer Anderson',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },
  {
    email: 'david.lee@toktickit.com',
    fullName: 'David Lee',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },
  {
    email: 'sarah.johnson@toktickit.com',
    fullName: 'Sarah Johnson',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },
  {
    email: 'emily.davis@toktickit.com',
    fullName: 'Emily Davis',
    role: Role.REQUESTER,
    isActive: true,
    mustChangePassword: true, // Needs mandatory first-login password change
    passwordHash: defaultPasswordHash,
  },
  {
    email: 'kevin.patel@toktickit.com',
    fullName: 'Kevin Patel',
    role: Role.REQUESTER,
    isActive: false, // Inactive requester
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },

  // IT Staff (3 active, 1 inactive)
  {
    email: 'michael.brown@toktickit.com',
    fullName: 'Michael Brown',
    role: Role.IT_STAFF,
    isActive: true,
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },
  {
    email: 'lisa.martinez@toktickit.com',
    fullName: 'Lisa Martinez',
    role: Role.IT_STAFF,
    isActive: true,
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },
  {
    email: 'robert.wilson@toktickit.com',
    fullName: 'Robert Wilson',
    role: Role.IT_STAFF,
    isActive: true,
    mustChangePassword: true, // Needs mandatory first-login password change
    passwordHash: defaultPasswordHash,
  },
  {
    email: 'amanda.clark@toktickit.com',
    fullName: 'Amanda Clark',
    role: Role.IT_STAFF,
    isActive: false, // Inactive IT Staff
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },

  // Administrator (1 active)
  {
    email: 'john.smith@toktickit.com',
    fullName: 'John Smith',
    role: Role.ADMINISTRATOR,
    isActive: true,
    mustChangePassword: false,
    passwordHash: defaultPasswordHash,
  },
];

async function main() {
  console.log('Start seeding Lab 3 data...');

  // 1. Seed Categories
  const categoryMap = new Map<string, number>();
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    categoryMap.set(created.name, created.id);
  }
  console.log(`Seeded ${categoryMap.size} categories.`);

  // 2. Seed Related Systems
  const systemMap = new Map<string, number>();
  for (const system of relatedSystems) {
    const created = await prisma.relatedSystem.upsert({
      where: { name: system.name },
      update: system,
      create: system,
    });
    systemMap.set(created.name, created.id);
  }
  console.log(`Seeded ${systemMap.size} related systems.`);

  // 3. Seed Users
  const userMap = new Map<string, number>();
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
    userMap.set(created.email, created.id);
  }
  console.log(`Seeded ${userMap.size} users.`);

  // Helpers for user IDs
  const jenniferId = userMap.get('jennifer.anderson@toktickit.com')!;
  const davidId = userMap.get('david.lee@toktickit.com')!;
  const sarahId = userMap.get('sarah.johnson@toktickit.com')!;
  const emilyId = userMap.get('emily.davis@toktickit.com')!;

  const michaelId = userMap.get('michael.brown@toktickit.com')!;
  const lisaId = userMap.get('lisa.martinez@toktickit.com')!;

  // 4. Seed Sample Tickets
  const sampleTickets = [
    {
      ticketNumber: 'TKT-2026-000001',
      summary: 'Laptop battery drains quickly',
      description: 'My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week\'s Windows update.',
      categoryName: 'Hardware',
      systemName: 'Corporate Laptop',
      requesterId: jenniferId,
      ownerId: michaelId,
      requestedPriority: Priority.MEDIUM,
      itPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.IN_PROGRESS,
      comments: [
        { authorId: jenniferId, content: 'Thank you for looking into this. Please let me know if you need battery diagnostic report.' },
        { authorId: michaelId, content: 'We are investigating the issue on your device. We\'ll update you shortly.' },
        { authorId: jenniferId, content: 'Just adding that this issue occurs even when I close all applications.' },
      ],
      notes: [
        { authorId: michaelId, content: 'Ran initial battery report via powercfg. Battery health is at 62% capacity. Replacement battery unit requested from inventory.' },
      ],
    },
    {
      ticketNumber: 'TKT-2026-000002',
      summary: 'Cannot connect to VPN from remote office',
      description: 'Cisco AnyConnect VPN connection fails with error code 412 (authentication timeout) when trying to access internal servers.',
      categoryName: 'Network',
      systemName: 'Corporate VPN',
      requesterId: sarahId,
      ownerId: lisaId,
      requestedPriority: Priority.HIGH,
      itPriority: Priority.HIGH,
      currentStatus: TicketStatus.OPEN,
      comments: [
        { authorId: lisaId, content: 'Hi Sarah, could you verify if your certificate is still valid in system keychain?' },
      ],
      notes: [
        { authorId: lisaId, content: 'Checked radius logs. Account certificate expired on Sept 1st. Preparing cert auto-renewal policy.' },
      ],
    },
    {
      ticketNumber: 'TKT-2026-000003',
      summary: 'Figma Desktop application license installation',
      description: 'Requesting software installation approval and corporate license key for Figma desktop client.',
      categoryName: 'Software',
      systemName: 'Corporate Laptop',
      requesterId: davidId,
      ownerId: null, // Unassigned ticket
      requestedPriority: Priority.LOW,
      itPriority: Priority.LOW,
      currentStatus: TicketStatus.NEW,
      comments: [],
      notes: [],
    },
    {
      ticketNumber: 'TKT-2026-000004',
      summary: 'Outlook email client sync error',
      description: 'Outlook fails to sync inbox messages and shows error: Server unreachable. Webmail works fine.',
      categoryName: 'Account and Access',
      systemName: 'Email/Outlook',
      requesterId: jenniferId,
      ownerId: michaelId,
      requestedPriority: Priority.HIGH,
      itPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
      comments: [
        { authorId: michaelId, content: 'Please try clearing your cached Exchange data in Account Settings > Reset Profile.' },
      ],
      notes: [
        { authorId: michaelId, content: 'Waiting for requester to test profile reset.' },
      ],
    },
    {
      ticketNumber: 'TKT-2026-000005',
      summary: 'Request access to Financial Reporting module in ERP',
      description: 'Need read access to Q3 ERP financial tables for audit reporting.',
      categoryName: 'Account and Access',
      systemName: 'ERP System',
      requesterId: emilyId,
      ownerId: lisaId,
      requestedPriority: Priority.MEDIUM,
      itPriority: Priority.HIGH,
      currentStatus: TicketStatus.RESOLVED,
      comments: [
        { authorId: lisaId, content: 'Access role `ERP_FIN_AUDIT_READ` has been granted to your account.' },
      ],
      notes: [
        { authorId: lisaId, content: 'Manager approval received via internal ticket ticket #FIN-882. Access provisioned in Azure AD group.' },
      ],
    },
  ];

  console.log('Seeding tickets, public comments, and internal notes...');
  for (const t of sampleTickets) {
    const categoryId = categoryMap.get(t.categoryName)!;
    const relatedSystemId = systemMap.get(t.systemName)!;

    const existing = await prisma.ticket.findUnique({
      where: { ticketNumber: t.ticketNumber },
    });

    let ticketId: number;

    if (!existing) {
      const created = await prisma.ticket.create({
        data: {
          ticketNumber: t.ticketNumber,
          summary: t.summary,
          description: t.description,
          categoryId,
          relatedSystemId,
          requesterId: t.requesterId,
          ownerId: t.ownerId,
          requestedPriority: t.requestedPriority,
          itPriority: t.itPriority,
          currentStatus: t.currentStatus,
        },
      });
      ticketId = created.id;
    } else {
      ticketId = existing.id;
    }

    // Seed Comments
    for (const c of t.comments) {
      await prisma.publicComment.create({
        data: {
          ticketId,
          authorId: c.authorId,
          content: c.content,
        },
      });
    }

    // Seed Internal Notes
    for (const n of t.notes) {
      await prisma.internalNote.create({
        data: {
          ticketId,
          authorId: n.authorId,
          content: n.content,
        },
      });
    }
  }

  console.log('Lab 3 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
