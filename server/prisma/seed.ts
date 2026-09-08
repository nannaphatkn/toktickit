import { PrismaClient, Priority, TicketStatus } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Account and Access', description: 'Password resets, access requests' },
  { name: 'Hardware', description: 'Issues with laptops, monitors, peripherals' },
  { name: 'Network', description: 'Wi-Fi, VPN, internet connectivity' },
  { name: 'Software', description: 'Installation, licensing, application crashes' },
];

const requesters = [
  { name: 'Jennifer Anderson', email: 'jennifer.a@company.com', isActive: true },
  { name: 'Michael Chen', email: 'michael.c@company.com', isActive: true },
  { name: 'Sarah Jenkins', email: 'sarah.j@company.com', isActive: true },
  { name: 'David Kim', email: 'david.k@company.com', isActive: true },
  { name: 'Robert Taylor', email: 'robert.t@company.com', isActive: false },
];

const relatedSystems = [
  { name: 'Corporate Laptop' },
  { name: 'Email/Outlook' },
  { name: 'Campus Wi-Fi' },
  { name: 'Corporate VPN' },
  { name: 'ERP System' },
  { name: 'Desktop Monitor/Peripherals' },
];

async function main() {
  console.log('Start seeding...');

  // Seed Categories
  const categoryMap = new Map<string, number>();
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    categoryMap.set(created.name, created.id);
    console.log(`Seeded category: ${created.name}`);
  }

  // Seed Requesters
  const requesterMap = new Map<string, number>();
  for (const requester of requesters) {
    const created = await prisma.requesterUser.upsert({
      where: { email: requester.email },
      update: requester,
      create: requester,
    });
    requesterMap.set(created.name, created.id);
    console.log(`Seeded requester: ${created.name} (ID: ${created.id})`);
  }

  // Seed Related Systems
  const systemMap = new Map<string, number>();
  for (const system of relatedSystems) {
    const created = await prisma.relatedSystem.upsert({
      where: { name: system.name },
      update: system,
      create: system,
    });
    systemMap.set(created.name, created.id);
    console.log(`Seeded related system: ${created.name}`);
  }

  // Seed Sample Tickets for all active requesters
  const sampleTickets = [
    // David Kim
    {
      ticketNumber: 'TKT-2026-000001',
      summary: 'Cannot connect to Corporate VPN from remote location',
      description: 'Whenever I try connecting to the VPN using Cisco AnyConnect, it returns authentication timeout error. I verified my password is correct.',
      categoryName: 'Network',
      systemName: 'Corporate VPN',
      requesterName: 'David Kim',
      requestedPriority: Priority.HIGH,
      currentStatus: TicketStatus.NEW,
    },
    {
      ticketNumber: 'TKT-2026-000002',
      summary: 'Dual Monitor display flickering on docking station',
      description: 'My secondary Dell 27 inch monitor flickers black every few minutes when connected to the USB-C dock.',
      categoryName: 'Hardware',
      systemName: 'Desktop Monitor/Peripherals',
      requesterName: 'David Kim',
      requestedPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.IN_PROGRESS,
    },
    {
      ticketNumber: 'TKT-2026-000003',
      summary: 'Request access to ERP Accounting Module',
      description: 'Need read and write access to the Q3 financial reports inside the ERP system for audit preparation.',
      categoryName: 'Account and Access',
      systemName: 'ERP System',
      requesterName: 'David Kim',
      requestedPriority: Priority.HIGH,
      currentStatus: TicketStatus.RESOLVED,
    },

    // Jennifer Anderson
    {
      ticketNumber: 'TKT-2026-000004',
      summary: 'Cannot login to Outlook email client after password update',
      description: 'I updated my domain password yesterday and now my desktop Outlook app keeps prompting for password endlessly.',
      categoryName: 'Account and Access',
      systemName: 'Email/Outlook',
      requesterName: 'Jennifer Anderson',
      requestedPriority: Priority.HIGH,
      currentStatus: TicketStatus.NEW,
    },
    {
      ticketNumber: 'TKT-2026-000005',
      summary: 'Campus Wi-Fi keeps disconnecting on 3rd floor',
      description: 'Wi-Fi signal drops frequently near meeting room B on the 3rd floor. Requires re-authenticating every 15 minutes.',
      categoryName: 'Network',
      systemName: 'Campus Wi-Fi',
      requesterName: 'Jennifer Anderson',
      requestedPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.IN_PROGRESS,
    },
    {
      ticketNumber: 'TKT-2026-000006',
      summary: 'Software installation request: Figma Desktop App',
      description: 'Requesting IT approval and installation of Figma Desktop client for UI mockups and design reviews.',
      categoryName: 'Software',
      systemName: 'Corporate Laptop',
      requesterName: 'Jennifer Anderson',
      requestedPriority: Priority.LOW,
      currentStatus: TicketStatus.RESOLVED,
    },

    // Michael Chen
    {
      ticketNumber: 'TKT-2026-000007',
      summary: 'Laptop trackpad not responding intermittently',
      description: 'My corporate MacBook trackpad freezes randomly for 10-15 seconds before working again.',
      categoryName: 'Hardware',
      systemName: 'Corporate Laptop',
      requesterName: 'Michael Chen',
      requestedPriority: Priority.MEDIUM,
      currentStatus: TicketStatus.NEW,
    },
    {
      ticketNumber: 'TKT-2026-000008',
      summary: 'ERP System exporting reports with encoding errors',
      description: 'CSV export from ERP contains broken special characters when opened in Excel.',
      categoryName: 'Software',
      systemName: 'ERP System',
      requesterName: 'Michael Chen',
      requestedPriority: Priority.HIGH,
      currentStatus: TicketStatus.IN_PROGRESS,
    },

    // Sarah Jenkins
    {
      ticketNumber: 'TKT-2026-000009',
      summary: 'Need reset for expired domain account password',
      description: 'My domain password expired while on leave. Unable to unlock my account remotely.',
      categoryName: 'Account and Access',
      systemName: 'Email/Outlook',
      requesterName: 'Sarah Jenkins',
      requestedPriority: Priority.HIGH,
      currentStatus: TicketStatus.CLOSED,
    },
  ];

  console.log('Seeding tickets...');
  for (const t of sampleTickets) {
    const requesterId = requesterMap.get(t.requesterName);
    const categoryId = categoryMap.get(t.categoryName);
    const relatedSystemId = systemMap.get(t.systemName);

    if (requesterId && categoryId && relatedSystemId) {
      const existing = await prisma.ticket.findUnique({
        where: { ticketNumber: t.ticketNumber },
      });

      if (!existing) {
        const created = await prisma.ticket.create({
          data: {
            ticketNumber: t.ticketNumber,
            summary: t.summary,
            description: t.description,
            categoryId,
            relatedSystemId,
            requesterId,
            requestedPriority: t.requestedPriority,
            currentStatus: t.currentStatus,
          },
        });
        console.log(`Created ticket #${created.ticketNumber} for ${t.requesterName}`);
      }
    }
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
