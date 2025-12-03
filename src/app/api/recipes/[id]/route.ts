/* eslint-disable import/prefer-default-export */
// src/app/api/recipes/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const recipeId = Number(params.id);
  if (Number.isNaN(recipeId)) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }

  const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const role = (session?.user as any)?.role;
  if (existing.authorId !== user.id && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, cost, prepTime, description, image, tagIds, ingredients } = body;

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
      cost: Number(cost) || existing.cost,
      prepTime: Number(prepTime) || existing.prepTime,
      description: typeof description === 'string' ? description : existing.description,
      image: image ?? existing.image,
    };

    if (Array.isArray(tagIds)) {
      data.tags = { set: tagIds.map((id: number) => ({ id: Number(id) })) };
    }

    if (ingredientConnect.length || ingredientConnectOrCreate.length) {
      data.ingredients = {
        ...(ingredientConnect.length ? { connect: ingredientConnect } : {}),
        ...(ingredientConnectOrCreate.length ? { connectOrCreate: ingredientConnectOrCreate } : {}),
      };
    }

    await prisma.recipe.update({ where: { id: recipeId }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating recipe:', err);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user?.email || role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recipeId = Number(params.id);
  if (Number.isNaN(recipeId)) {
    return NextResponse.json({ error: 'Invalid recipe id' }, { status: 400 });
  }

  try {
    await prisma.recipe.delete({
      where: { id: recipeId },
    });

    // Favorites and other relations are removed via onDelete: Cascade in Prisma schema
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 },
    );
  }
}
