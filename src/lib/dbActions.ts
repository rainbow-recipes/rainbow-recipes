'use server';

import { Store, ItemCategory, Prisma } from '@prisma/client';
import { hash } from 'bcrypt';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';

/* --- User actions --- */

export async function signUp(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('A user with that email already exists');
  }

  const hashed = await hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName: firstName || null,
      lastName: lastName || null,
      name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || null,
      role: 'USER',
    },
  });

  return { success: true };
}

export async function vendorSignUp(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('A user with that email already exists');
  }

  const hashed = await hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName: firstName || null,
      lastName: lastName || null,
      name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || null,
      role: 'USER',
      isMerchant: true,
      merchantApproved: false, // must be approved by admin
    },
  });

  return { success: true };
}

export async function deleteUser(userId: string, adminEmail: string) {
  // Prevent admin from deleting themselves
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (adminUser && adminUser.id === userId) {
    throw new Error('Admins cannot delete themselves');
  }

  await prisma.user.delete({
    where: { id: userId },
  });
}

export async function approveMerchant(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { merchantApproved: true },
  });
}

/* --- Profile actions --- */

export async function updateProfile(
  userEmail: string,
  profileData: { firstName?: string; lastName?: string; image?: string },
) {
  const { firstName, lastName, image } = profileData;

  // Build full name from firstName and lastName
  const fullName = [firstName, lastName].filter((p) => p && p.trim().length > 0).join(' ')
    || null;

  const updatedUser = await prisma.user.update({
    where: {
      email: userEmail,
    },
    data: {
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      image: image ?? null,
      name: fullName, // keep the core `name` field in sync
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      image: true,
      role: true,
      isMerchant: true,
      merchantApproved: true,
    },
  });

  return { user: updatedUser };
}

export async function changePassword(credentials: { email: string; password: string }) {
  // console.log(`changePassword data: ${JSON.stringify(credentials, null, 2)}`);
  const password = await hash(credentials.password, 10);
  await prisma.user.update({
    where: { email: credentials.email },
    data: {
      password,
    },
  });
}

/* --- Store actions --- */

export async function createStore(credentials: { id: string; owner: string }) {
  await prisma.store.create({
    data: {
      id: credentials.id,
      name: 'My Store',
      website: null,
      location: '',
      hours: ['', '', '', '', '', '', ''],
      image: null,
      owner: credentials.owner,
    },
  });
}

export async function editStore(store: Store) {
  await prisma.store.update({
    where: { id: store.id },
    data: {
      name: store.name,
      website: store.website,
      location: store.location,
      hours: store.hours,
      image: store.image,
      owner: store.owner,
    },
  });
  redirect('/my-store');
}

export async function getStores() {
  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      website: true,
      location: true,
      hours: true,
      image: true,
      owner: true,
    },
    orderBy: { name: 'asc' },
  });

  return stores;
}

/* --- StoreItem actions --- */

export async function addStoreItem(item: {
  name: string;
  price: number;
  unit: string;
  availability: string;
  owner: string;
  itemCategory?: string;
}) {
  // Interpret availability string from form: 'in_stock' -> true, otherwise false
  const availability = item.availability === 'in_stock';

  const name = String(item.name || '').trim();
  const category = item.itemCategory;

  // Find or create DatabaseItem, updating category if it changed
  let databaseItem = await prisma.databaseItem.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (!databaseItem) {
    databaseItem = await prisma.databaseItem.create({
      data: {
        name,
        itemCategory: (category ?? 'other') as ItemCategory,
        approved: false,
      },
    });
  } else if (category && databaseItem.itemCategory !== category) {
    databaseItem = await prisma.databaseItem.update({
      where: { id: databaseItem.id },
      data: { itemCategory: category as ItemCategory },
    });
  }

  // Ensure price is a Prisma Decimal on the server side
  const createPrice = (typeof item.price === 'object' && item.price !== null && 'toNumber' in (item.price as any))
    ? (item.price as any)
    : new Prisma.Decimal(item.price as any);

  await prisma.storeItem.create({
    data: {
      databaseItemId: databaseItem.id,
      price: createPrice,
      unit: item.unit,
      availability,
      owner: item.owner,
    },
  });
  redirect('/my-store');
}

export async function editStoreItem(item: any) {
  const name = String(item.name || '').trim();
  const category = item.itemCategory;

  // Find DatabaseItem by name (unique). If not found, create. If found and category differs, update category.
  let databaseItem = await prisma.databaseItem.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (!databaseItem) {
    databaseItem = await prisma.databaseItem.create({
      data: {
        name,
        itemCategory: category ?? 'other',
        approved: false,
      },
    });
  } else if (category && databaseItem.itemCategory !== category) {
    // Update the catalog category to reflect the edited value
    databaseItem = await prisma.databaseItem.update({
      where: { id: databaseItem.id },
      data: { itemCategory: category },
    });
  }

  const updatePrice = (typeof item.price === 'object' && item.price !== null && 'toNumber' in (item.price as any))
    ? (item.price as any)
    : new Prisma.Decimal(item.price as any);

  await prisma.storeItem.update({
    where: { id: item.id },
    data: {
      databaseItemId: databaseItem.id,
      price: updatePrice,
      unit: item.unit,
      availability: item.availability,
      owner: item.owner,
    },
  });
  redirect('/my-store');
}

export async function deleteStoreItem(id: number) {
  await prisma.storeItem.delete({
    where: { id },
  });
  redirect('/my-store');
}

/* --- DatabaseItem actions --- */

export async function addDatabaseItem(item: {
  name: string;
  ItemCategory: string;
  approved: boolean;
}) {
  let itemCategory: ItemCategory;
  if (item.ItemCategory === 'produce') {
    itemCategory = 'produce';
  } else if (item.ItemCategory === 'meat_seafood') {
    itemCategory = 'meat_seafood';
  } else if (item.ItemCategory === 'dairy_eggs') {
    itemCategory = 'dairy_eggs';
  } else if (item.ItemCategory === 'frozen') {
    itemCategory = 'frozen';
  } else if (item.ItemCategory === 'canned') {
    itemCategory = 'canned';
  } else if (item.ItemCategory === 'dry') {
    itemCategory = 'dry';
  } else if (item.ItemCategory === 'condiments_spices') {
    itemCategory = 'condiments_spices';
  } else {
    itemCategory = 'other';
  }

  await prisma.databaseItem.create({
    data: {
      name: item.name,
      itemCategory,
      approved: item.approved,
    },
  });
  redirect('/admin?tab=items');
}

export async function getDatabaseItems() {
  const databaseItems = await prisma.databaseItem.findMany({
    orderBy: { name: 'asc' },
  });
  return databaseItems.map((item) => ({
    id: item.id,
    name: item.name,
    itemCategory: item.itemCategory,
    approved: item.approved,
  }));
}

export async function approveDatabaseItem(itemId: number) {
  await prisma.databaseItem.update({
    where: { id: itemId },
    data: { approved: true },
  });
}

export async function deleteDatabaseItem(itemId: number) {
  try {
    // Remove any StoreItems referencing this DatabaseItem to avoid FK violations
    await prisma.$transaction([
      prisma.storeItem.deleteMany({ where: { databaseItemId: itemId } }),
      prisma.databaseItem.delete({ where: { id: itemId } }),
    ]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error deleting database item', err);
    throw err;
  }
}

export async function mergeDatabaseItems(sourceId: number, targetId: number) {
  const src = Number(sourceId);
  const dest = Number(targetId);

  if (Number.isNaN(src) || Number.isNaN(dest)) {
    throw new Error('sourceId and targetId must be numbers');
  }

  if (src === dest) {
    throw new Error('sourceId and targetId must be different');
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [sourceItem, targetItem] = await Promise.all([
        tx.databaseItem.findUnique({ where: { id: src } }),
        tx.databaseItem.findUnique({ where: { id: dest } }),
      ]);

      if (!sourceItem || !targetItem) {
        throw new Error('Source or target item not found');
      }

      // Move store items to target
      await tx.storeItem.updateMany({
        where: { databaseItemId: src },
        data: { databaseItemId: dest },
      });

      // Update recipes that reference the source ingredient
      const recipes = await tx.recipe.findMany({
        where: { ingredients: { some: { id: src } } },
        include: { ingredients: { select: { id: true } } },
      });

      // Rewire ingredient lists to use the target and drop the source (avoid duplicates)
      // eslint-disable-next-line no-restricted-syntax
      for (const recipe of recipes) {
        const newIds = Array.from(new Set([
          ...recipe.ingredients.map((ing) => ing.id).filter((id) => id !== src),
          dest,
        ]));

        // eslint-disable-next-line no-await-in-loop
        await tx.recipe.update({
          where: { id: recipe.id },
          data: { ingredients: { set: newIds.map((id) => ({ id })) } },
        });
      }

      // Finally delete the source database item
      await tx.databaseItem.delete({ where: { id: src } });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error merging database items', err);
    throw err;
  }
}

export async function updateDatabaseItem(data: { itemId: number; name: string; itemCategory: string }) {
  try {
    const updated = await prisma.databaseItem.update({
      where: { id: Number(data.itemId) },
      data: { name: data.name, itemCategory: data.itemCategory as ItemCategory },
    });

    return updated;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error('A database item with that name already exists.');
    }
    throw new Error('Failed to update item.');
  }
}

/* --- Tag actions --- */

export async function getTags() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      recipes: true,
    },
  });
  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    category: tag.category,
    recipeCount: tag.recipes.length,
  }));
}

export async function addTag(data: { name: string; category: string }) {
  if (data.category !== 'Diet' && data.category !== 'Appliance') {
    throw new Error('category must be "Diet" or "Appliance"');
  }

  try {
    const created = await prisma.tag.create({
      data: {
        name: String(data.name).trim(),
        category: String(data.category),
      },
    });

    return created;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error('A tag with that name already exists.');
    }
    throw new Error('Failed to create tag.');
  }
}

export async function editTag(data: { id: number; name: string; category: string }) {
  if (data.category !== 'Diet' && data.category !== 'Appliance') {
    throw new Error('category must be "Diet" or "Appliance"');
  }

  try {
    const updated = await prisma.tag.update({
      where: { id: Number(data.id) },
      data: {
        name: String(data.name).trim(),
        category: String(data.category),
      },
    });

    return updated;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new Error('A tag with that name already exists.');
      }
      if (err.code === 'P2025') {
        throw new Error('Tag not found.');
      }
    }
    throw new Error('Failed to update tag.');
  }
}

export async function deleteTag(id: number) {
  try {
    await prisma.tag.delete({
      where: { id: Number(id) },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new Error('Tag not found.');
    }
    throw new Error('Failed to delete tag.');
  }
}

/* --- Recipe actions --- */

export async function toggleFavorite(userEmail: string, recipeId: number) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // toggle favorite
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_recipeId: {
        userId: user.id,
        recipeId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: {
        userId: user.id,
        recipeId,
      },
    });
  }

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });

  return { favorited: !existing, favoritesCount };
}

export async function searchIngredients(q: string, take: number = 10) {
  const qTrim = String(q).trim();
  if (!qTrim) return [];

  // Build OR filters: full-phrase match plus each significant token
  const tokens = qTrim.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  const ors: Prisma.DatabaseItemWhereInput[] = [];
  // full query first
  ors.push({ name: { contains: qTrim, mode: 'insensitive' } });
  // include token matches (limit tokens to avoid many clauses)
  tokens
    .filter((t) => t.length >= 2)
    .slice(0, 6)
    .forEach((t) => ors.push({ name: { contains: t, mode: 'insensitive' } }));

  const items = await prisma.databaseItem.findMany({
    where: { OR: ors },
    take: Math.max(1, take),
    orderBy: { name: 'asc' },
  });

  // dedupe by id (in case multiple clauses returned same item)
  const seen = new Set<number>();
  const deduped: typeof items = [];
  for (const it of items) {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      deduped.push(it);
    }
  }

  return deduped;
}

export async function createRecipe(userEmail: string, recipeData: any) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const { name, cost, prepTime, description, image, tagIds, ingredients, ingredientQuantities } = recipeData;

  // Validate positive numbers
  const costNum = Number(cost) || 0;
  const prepNum = Number(prepTime) || 0;
  if (costNum < 0) {
    throw new Error('Cost must be a positive number');
  }
  if (prepNum < 0) {
    throw new Error('Prep time must be a positive number');
  }

  // prepare nested write payload for ingredients
  const ingredientConnect: Array<{ id: number }> = [];
  const ingredientConnectOrCreate: Array<any> = [];
  if (Array.isArray(ingredients)) {
    for (const ing of ingredients) {
      if (ing && typeof ing === 'object' && Number(ing.id)) {
        ingredientConnect.push({ id: Number(ing.id) });
      } else if (ing && typeof ing === 'object' && ing.name) {
        const category = ing.itemCategory && typeof ing.itemCategory === 'string'
          ? String(ing.itemCategory)
          : 'other';
        const cleaned = String(ing.name).trim().replace(/\s+/g, ' ');
        ingredientConnectOrCreate.push({
          where: { name: cleaned },
          create: { name: cleaned, itemCategory: category },
        });
      }
    }
  }

  const recipe = await prisma.recipe.create({
    data: {
      name: name || '(Untitled)',
      cost: costNum,
      prepTime: prepNum,
      description: description || '',
      image: image || null,
      ingredientQuantities: Array.isArray(ingredientQuantities) ? ingredientQuantities : [],
      author: { connect: { id: user.id } },
      tags:
        tagIds && tagIds.length
          ? { connect: tagIds.map((id: number) => ({ id: Number(id) })) }
          : undefined,
      ingredients:
        (ingredientConnect.length || ingredientConnectOrCreate.length)
          ? {
            ...(ingredientConnect.length ? { connect: ingredientConnect } : {}),
            ...(ingredientConnectOrCreate.length ? { connectOrCreate: ingredientConnectOrCreate } : {}),
          }
          : undefined,
    },
  });

  // Re-fetch to ensure we have ingredients in consistent order
  const createdRecipe = await prisma.recipe.findUnique({
    where: { id: recipe.id },
    include: { ingredients: true },
  });

  // Rebuild ingredientQuantities to match ingredient order from the original submission
  if (createdRecipe && Array.isArray(ingredients)) {
    const ingredientIdMap = new Map<number, number>();
    ingredients.forEach((ing: any, idx: number) => {
      if (ing.id) {
        ingredientIdMap.set(ing.id, idx);
      }
    });

    // Create sorted quantities array matching the server-stored ingredient order
    const reorderedQuantities = (createdRecipe.ingredients || []).map((ing: any) => {
      const originalIdx = ingredientIdMap.get(ing.id);
      return originalIdx !== undefined && ingredientQuantities[originalIdx]
        ? ingredientQuantities[originalIdx]
        : '';
    });

    // Update with reordered quantities
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { ingredientQuantities: reorderedQuantities },
    });
  }

  return { success: true, id: recipe.id };
}

export async function updateRecipe(userEmail: string, recipeId: number, recipeData: any) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (Number.isNaN(recipeId)) {
    throw new Error('Invalid recipe id');
  }

  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true },
  });

  if (!existing) {
    throw new Error('Recipe not found');
  }

  const role = (await prisma.user.findUnique({ where: { id: user.id } }))?.role;
  if (existing.authorId !== user.id && role !== 'ADMIN') {
    throw new Error('Forbidden: You do not have permission to edit this recipe');
  }

  const { name, cost, prepTime, description, image, tagIds, ingredients, ingredientQuantities } = recipeData;

  // Validate positive numbers
  const costNum = cost !== undefined ? Number(cost) : existing.cost;
  const prepNum = prepTime !== undefined ? Number(prepTime) : existing.prepTime;
  if (costNum < 0) {
    throw new Error('Cost must be a positive number');
  }
  if (prepNum < 0) {
    throw new Error('Prep time must be a positive number');
  }

  // prepare nested write payload for ingredients
  const ingredientConnect: Array<{ id: number }> = [];
  const ingredientConnectOrCreate: Array<any> = [];
  if (Array.isArray(ingredients)) {
    for (const ing of ingredients) {
      if (ing && typeof ing === 'object' && Number(ing.id)) {
        ingredientConnect.push({ id: Number(ing.id) });
      } else if (ing && typeof ing === 'object' && ing.name) {
        const category = ing.itemCategory && typeof ing.itemCategory === 'string'
          ? String(ing.itemCategory)
          : 'other';
        const cleaned = String(ing.name).trim().replace(/\s+/g, ' ');
        ingredientConnectOrCreate.push({
          where: { name: cleaned },
          create: { name: cleaned, itemCategory: category },
        });
      }
    }
  }

  const data: any = {
    name: name || existing.name,
    cost: costNum,
    prepTime: prepNum,
    description: typeof description === 'string' ? description : existing.description,
    image: image ?? existing.image,
    ingredientQuantities: Array.isArray(ingredientQuantities) ? ingredientQuantities : existing.ingredientQuantities,
  };

  if (Array.isArray(tagIds)) {
    data.tags = { set: tagIds.map((id: number) => ({ id: Number(id) })) };
  }

  // Always disconnect all existing ingredients, then connect new ones
  const existingIngredients = existing.ingredients || [];
  const disconnectArray = existingIngredients.map((ing: any) => ({ id: ing.id }));
  data.ingredients = {
    ...(disconnectArray.length ? { disconnect: disconnectArray } : {}),
    ...(ingredientConnect.length ? { connect: ingredientConnect } : {}),
    ...(ingredientConnectOrCreate.length ? { connectOrCreate: ingredientConnectOrCreate } : {}),
  };

  await prisma.recipe.update({ where: { id: recipeId }, data });

  // Re-fetch to ensure we have ingredients in consistent order
  const updatedRecipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true },
  });

  // Rebuild ingredientQuantities to match ingredient order
  if (updatedRecipe && Array.isArray(ingredients)) {
    const ingredientIdMap = new Map<number, number>();
    ingredients.forEach((ing: any, idx: number) => {
      if (ing.id) {
        ingredientIdMap.set(ing.id, idx);
      }
    });

    // Create sorted quantities array matching the server-stored ingredient order
    const reorderedQuantities = (updatedRecipe.ingredients || []).map((ing: any) => {
      const originalIdx = ingredientIdMap.get(ing.id);
      return originalIdx !== undefined && ingredientQuantities[originalIdx]
        ? ingredientQuantities[originalIdx]
        : '';
    });

    // Update with reordered quantities
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { ingredientQuantities: reorderedQuantities },
    });
  }

  return { success: true };
}

export async function deleteRecipe(userEmail: string, recipeId: number) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (Number.isNaN(recipeId)) {
    throw new Error('Invalid recipe id');
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  const { role } = user;
  if (recipe.authorId !== user.id && role !== 'ADMIN') {
    throw new Error('Forbidden: You do not have permission to delete this recipe');
  }

  await prisma.recipe.delete({
    where: { id: recipeId },
  });

  return { success: true };
}

export async function createRecipeReview(
  userEmail: string,
  reviewData: { recipeId: number; rating: number; review: string },
) {
  const { recipeId, rating, review } = reviewData;

  if (!recipeId || !rating || !review) {
    throw new Error('Missing required fields: recipeId, rating, review');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  if (review.trim().length < 10) {
    throw new Error('Review must be at least 10 characters');
  }

  // Verify recipe exists
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Prevent recipe author from reviewing their own recipe
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });

  if (recipe.authorId === user?.id) {
    throw new Error('You cannot review your own recipe');
  }

  // Create the review
  const newReview = await prisma.recipeReview.create({
    data: {
      recipeId,
      rating,
      review: review.trim(),
      owner: userEmail,
    },
  });

  return newReview;
}

export async function deleteRecipeReview(userEmail: string, reviewId: number) {
  if (Number.isNaN(reviewId)) {
    throw new Error('Invalid review ID');
  }

  // Fetch the review to check ownership
  const review = await prisma.recipeReview.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  // Check if user is the owner or an admin
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (review.owner !== userEmail && user.role !== 'ADMIN') {
    throw new Error('You do not have permission to delete this review');
  }

  // Delete the review
  await prisma.recipeReview.delete({
    where: { id: reviewId },
  });

  revalidatePath(`/recipes/${review.recipeId}`);
  return { success: true };
}

/* --- Vendor actions --- */

export async function createVendorReview(
  userEmail: string,
  reviewData: { storeId: string; rating: number; review: string },
) {
  const { storeId, rating, review } = reviewData;

  if (!storeId || !rating || !review) {
    throw new Error('Missing required fields: storeId, rating, review');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  if (review.trim().length < 10) {
    throw new Error('Review must be at least 10 characters');
  }

  // Verify store exists
  const store = await prisma.store.findUnique({
    where: { id: String(storeId) },
    select: {
      id: true,
      owner: true,
    },
  });

  if (!store) {
    throw new Error('Store not found');
  }

  // Prevent store owner from reviewing their own store
  if (store.owner === userEmail) {
    throw new Error('You cannot review your own store');
  }

  // Create the review
  const newReview = await prisma.vendorReview.create({
    data: {
      storeId: store.id,
      rating,
      review: review.trim(),
      owner: userEmail,
    },
  });

  return newReview;
}

export async function deleteVendorReview(userEmail: string, reviewId: number) {
  if (Number.isNaN(reviewId)) {
    throw new Error('Invalid review ID');
  }

  // Fetch the review to check ownership
  const review = await prisma.vendorReview.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  // Check if user is the owner or an admin
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (review.owner !== userEmail && user.role !== 'ADMIN') {
    throw new Error('You do not have permission to delete this review');
  }

  // Delete the review
  await prisma.vendorReview.delete({
    where: { id: reviewId },
  });

  revalidatePath(`/vendors/${review.storeId}`);
  return { success: true };
}
