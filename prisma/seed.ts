import { PrismaClient, Role, ItemCategory } from '@prisma/client';
import { hash } from 'bcrypt';
import * as config from '../config/settings.development.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding the database');

  // ----- Users -----
  const password = await hash('changeme', 10);

  // Keep a map of email -> user id so stores can use the owner's id as the store id
  const emailToId: Record<string, string> = {};

  for (const account of config.defaultAccounts) {
    const role = (account.role as Role) || Role.USER;
    console.log(`  Creating user: ${account.email} with role: ${role}`);
    // eslint-disable-next-line no-await-in-loop
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        password,
        role,
        isMerchant: account.isMerchant || false,
        merchantApproved: account.merchantApproved || false,
      },
    });
    emailToId[account.email] = user.id;
  }

  for (const store of config.defaultStore) {
    console.log(`  Adding store: ${JSON.stringify(store)}`);
    // Resolve the owner's user id from the map (or fallback to DB lookup)
    const ownerEmail = store.owner as string;
    let ownerId: string | undefined = emailToId[ownerEmail];
    if (!ownerId) {
      // eslint-disable-next-line no-await-in-loop
      const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
      ownerId = user?.id;
    }
    if (!ownerId) {
      console.warn(`  Skipping store '${store.name}': owner '${ownerEmail}' not found`);
      // eslint-disable-next-line no-continue
      continue;
    }

    // Use the owner's user id as the Store.id and store.owner value
    // eslint-disable-next-line no-await-in-loop
    await prisma.store.upsert({
      where: { id: ownerId },
      update: {},
      create: {
        id: ownerId,
        name: store.name,
        // Required fields on Store: provide sensible defaults for seed data
        location: '',
        hours: [],
        owner: ownerEmail,
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

  for (let i = 0; i < config.defaultStoreItems.length; i += 1) {
    const storeItem = config.defaultStoreItems[i];
    console.log(`  Adding store item: ${JSON.stringify(storeItem)}`);

    // Find the corresponding DatabaseItem by name (case-insensitive)
    // eslint-disable-next-line no-await-in-loop
    const databaseItem = await prisma.databaseItem.findFirst({
      where: {
        name: {
          equals: storeItem.name,
          mode: 'insensitive',
        },
      },
    });

    if (!databaseItem) {
      console.warn(`  Skipping store item '${storeItem.name}': corresponding database item not found`);
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await prisma.storeItem.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        databaseItemId: databaseItem.id,
        price: storeItem.price,
        unit: storeItem.unit,
        availability: storeItem.availability,
        owner: storeItem.owner,
      },
    });
  }

  console.log('  Seeding tags');
  for (const tag of [...config.defaultDietTags, ...config.defaultApplianceTags]) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.tag.upsert({
      where: { name: tag.name }, // name is unique
      update: { category: tag.category },
      create: tag,
    });
  }

  // ----- Default recipe -----
  const { defaultRecipe } = config;

  if (defaultRecipe) {
    console.log('  Seeding default recipe');

    const ingredientRecords = await prisma.databaseItem.findMany({
      where: { name: { in: defaultRecipe.ingredientNames } },
    });

    if (ingredientRecords.length !== defaultRecipe.ingredientNames.length) {
      console.warn('  Warning: Some default recipe ingredients were not found in database items.');
    }

    const matchedIngredients = defaultRecipe.ingredientNames
      .map((name, index) => {
        const record = ingredientRecords.find((item) => item.name === name);
        return record ? { record, quantity: defaultRecipe.ingredientQuantities[index] } : null;
      })
      .filter((entry): entry is { record: typeof ingredientRecords[number]; quantity: string } => Boolean(entry));

    const authorId = emailToId[defaultRecipe.authorEmail];

    const existingRecipe = await prisma.recipe.findFirst({ where: { name: defaultRecipe.name } });

    if (existingRecipe) {
      console.log(`  Recipe "${defaultRecipe.name}" already exists, skipping create.`);
    } else {
      await prisma.recipe.create({
        data: {
          name: defaultRecipe.name,
          cost: defaultRecipe.cost,
          prepTime: defaultRecipe.prepTime,
          ingredientQuantities: matchedIngredients.map((entry) => entry.quantity),
          description: defaultRecipe.description,
          authorId,
          ingredients: {
            connect: matchedIngredients.map(({ record }) => ({ id: record.id })),
          },
          tags: {
            connect: defaultRecipe.tagNames.map((name) => ({ name })),
          },
        },
      });
    }
  } else {
    console.log('  No default recipe configured, skipping.');
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
