import { PrismaClient } from '@prisma/client';

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
  for (const category of categories) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: category.name },
    });

    if (!existingCategory) {
      const created = await prisma.category.create({
        data: category,
      });
      console.log(`Created category: ${created.name}`);
    } else {
      console.log(`Category already exists: ${existingCategory.name}`);
    }
  }

  // Seed Requesters
  for (const requester of requesters) {
    const existingRequester = await prisma.requesterUser.findUnique({
      where: { email: requester.email },
    });

    if (!existingRequester) {
      const created = await prisma.requesterUser.create({
        data: requester,
      });
      console.log(`Created requester: ${created.name} (active: ${created.isActive})`);
    } else {
      console.log(`Requester already exists: ${existingRequester.name}`);
    }
  }

  // Seed Related Systems
  for (const system of relatedSystems) {
    const existingSystem = await prisma.relatedSystem.findUnique({
      where: { name: system.name },
    });

    if (!existingSystem) {
      const created = await prisma.relatedSystem.create({
        data: system,
      });
      console.log(`Created related system: ${created.name}`);
    } else {
      console.log(`Related system already exists: ${existingSystem.name}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
