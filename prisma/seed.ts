import { PrismaClient, Role, Condition, ItemCategory } from '@prisma/client';
import { hash } from 'bcrypt';
import * as config from '../config/settings.development.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database');

  // ----- Users -----
  const password = await hash('changeme', 10);

  for (const account of config.defaultAccounts) {
    const role = (account.role as Role) || Role.USER;
    console.log(`  Creating user: ${account.email} with role: ${role}`);
    // eslint-disable-next-line no-await-in-loop
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        password,
        role,
      },
    });
  }

  // ----- Original Stuff data (optional, you can remove this if you don't need Stuff any more) -----
  for (const data of config.defaultData) {
    const condition = (data.condition as Condition) || Condition.good;
    console.log(`  Adding stuff: ${JSON.stringify(data)}`);
    // eslint-disable-next-line no-await-in-loop
    await prisma.stuff.upsert({
      where: { id: config.defaultData.indexOf(data) + 1 },
      update: {},
      create: {
        name: data.name,
        quantity: data.quantity,
        owner: data.owner,
        condition,
      },
    });
  }

  for (const item of config.defaultItems) {
    console.log(`  Adding item: ${JSON.stringify(item)}`);
    // eslint-disable-next-line no-await-in-loop
    await prisma.item.upsert({
      where: { id: config.defaultItems.indexOf(item) + 1 },
      update: {},
      create: {
        name: item.name,
        price: item.price,
        unit: item.unit,
        availability: item.availability,
        owner: item.owner,
      },
    });
  }

  // ----- Database items (produce, meat, dairy, etc.) -----
  for (const databaseItem of config.defaultDatabaseItems) {
    const itemCategory = (databaseItem.itemCategory as ItemCategory) || ItemCategory.other;
    console.log(`  Adding database item: ${JSON.stringify(databaseItem)}`);
    // eslint-disable-next-line no-await-in-loop
    // Upsert by name (name is unique in schema)
    // eslint-disable-next-line no-await-in-loop
    await prisma.databaseItem.upsert({
      where: { name: String(databaseItem.name) },
      update: { itemCategory },
      create: {
        name: databaseItem.name,
        itemCategory,
      },
    });
  }

  // ----- New: recipe tags -----
  const dietTags = [
    { name: 'Vegan', category: 'Diet' },
    { name: 'Vegetarian', category: 'Diet' },
    { name: 'Gluten-free', category: 'Diet' },
    { name: 'Dairy-free', category: 'Diet' },
  ];

  const applianceTags = [
    { name: 'Oven', category: 'Appliance' },
    { name: 'Stovetop', category: 'Appliance' },
    { name: 'Blender', category: 'Appliance' },
    { name: 'Microwave', category: 'Appliance' },
    { name: 'Instant Pot', category: 'Appliance' },
  ];

  console.log('  Seeding tags');
  for (const tag of [...dietTags, ...applianceTags]) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.tag.upsert({
      where: { name: tag.name }, // name is unique
      update: { category: tag.category },
      create: tag,
    });
  }

  console.log('Seeding complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
