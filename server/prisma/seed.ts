import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Hardware', description: 'Issues with laptops, monitors, peripherals' },
  { name: 'Software', description: 'Installation, licensing, application crashes' },
  { name: 'Network', description: 'Wi-Fi, VPN, internet connectivity' },
  { name: 'Account', description: 'Password resets, access requests' },
  { name: 'Other', description: 'General inquiries and other issues' },
];

async function main() {
  console.log('Start seeding...');
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
