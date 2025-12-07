'use server';

import { Stuff, Condition, Store, ItemCategory, Prisma } from '@prisma/client';
import { hash } from 'bcrypt';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';

export async function createStore(credentials: { id: string; owner: string }) {
  // console.log(`createUser data: ${JSON.stringify(credentials, null, 2)}`);
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
  // console.log(`editStore data: ${JSON.stringify(store, null, 2)}`);
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
  // After updating, redirect to the my store page
  redirect('/my-store');
}

export async function addItem(item: {
  name: string;
  price: number;
  unit: string;
  availability: string;
  itemCategory: string;
  owner: string
}) {
  let itemCategory: ItemCategory;
  if (item.itemCategory === 'produce') {
    itemCategory = 'produce';
  } else if (item.itemCategory === 'meat_seafood') {
    itemCategory = 'meat_seafood';
  } else if (item.itemCategory === 'dairy_eggs') {
    itemCategory = 'dairy_eggs';
  } else if (item.itemCategory === 'frozen') {
    itemCategory = 'frozen';
  } else if (item.itemCategory === 'canned') {
    itemCategory = 'canned';
  } else if (item.itemCategory === 'dry') {
    itemCategory = 'dry';
  } else if (item.itemCategory === 'condiments_spices') {
    itemCategory = 'condiments_spices';
  } else {
    itemCategory = 'other';
  }
  // Interpret availability string from form: 'in_stock' -> true, otherwise false
  const availability = item.availability === 'in_stock';

  // Ensure price is a Prisma Decimal on the server side to satisfy typing/runtime
  const createPrice = (typeof item.price === 'object' && item.price !== null && 'toNumber' in (item.price as any))
    ? (item.price as any)
    : new Prisma.Decimal(item.price as any);

  await prisma.item.create({
    data: {
      name: item.name,
      price: createPrice,
      unit: item.unit,
      availability,
      itemCategory,
      owner: item.owner,
    },
  });
  redirect('/my-store');
}

// Accept a permissive shape so callers can pass numeric `price` from forms
export async function editItem(item: any) {
  const updatePrice = (typeof item.price === 'object' && item.price !== null && 'toNumber' in (item.price as any))
    ? (item.price as any)
    : new Prisma.Decimal(item.price as any);

  await prisma.item.update({
    where: { id: item.id },
    data: {
      name: item.name,
      price: updatePrice,
      unit: item.unit,
      availability: item.availability,
      itemCategory: item.itemCategory,
      owner: item.owner,
    },
  });
  redirect('/my-store');
}

export async function deleteItem(id: number) {
  // console.log(`deleteItem id: ${id}`);
  await prisma.item.delete({
    where: { id },
  });
  // After deleting, redirect to the list page
  redirect('/my-store');
}

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

/**
 * Adds a new stuff to the database.
 * @param stuff, an object with the following properties: name, quantity, owner, condition.
 */
export async function addStuff(stuff: { name: string; quantity: number; owner: string; condition: string }) {
  // console.log(`addStuff data: ${JSON.stringify(stuff, null, 2)}`);
  let condition: Condition = 'good';
  if (stuff.condition === 'poor') {
    condition = 'poor';
  } else if (stuff.condition === 'excellent') {
    condition = 'excellent';
  } else {
    condition = 'fair';
  }
  await prisma.stuff.create({
    data: {
      name: stuff.name,
      quantity: stuff.quantity,
      owner: stuff.owner,
      condition,
    },
  });
  // After adding, redirect to the list page
  redirect('/list');
}

/**
 * Edits an existing stuff in the database.
 * @param stuff, an object with the following properties: id, name, quantity, owner, condition.
 */
export async function editStuff(stuff: Stuff) {
  // console.log(`editStuff data: ${JSON.stringify(stuff, null, 2)}`);
  await prisma.stuff.update({
    where: { id: stuff.id },
    data: {
      name: stuff.name,
      quantity: stuff.quantity,
      owner: stuff.owner,
      condition: stuff.condition,
    },
  });
  // After updating, redirect to the list page
  redirect('/list');
}

/**
 * Deletes an existing stuff from the database.
 * @param id, the id of the stuff to delete.
 */
export async function deleteStuff(id: number) {
  // console.log(`deleteStuff id: ${id}`);
  await prisma.stuff.delete({
    where: { id },
  });
  // After deleting, redirect to the list page
  redirect('/list');
}

/**
 * Creates a new user in the database.
 * @param credentials, an object with the following properties: email, password.
 */
export async function createUser(credentials: { email: string; password: string }) {
  // console.log(`createUser data: ${JSON.stringify(credentials, null, 2)}`);
  const password = await hash(credentials.password, 10);
  await prisma.user.create({
    data: {
      email: credentials.email,
      password,
    },
  });
}

/**
 * Changes the password of an existing user in the database.
 * @param credentials, an object with the following properties: email, password.
 */
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
