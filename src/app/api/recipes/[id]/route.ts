/* eslint-disable import/prefer-default-export */
// src/app/api/recipes/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const recipeId = Number(params.id);
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { tags: true, ingredients: true, author: true },
    });
    return NextResponse.json(recipe);
  } catch (err) {
    console.error('Error fetching recipe with includes, falling back:', err);
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    return NextResponse.json(recipe);
  }
}

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

  const existing = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const role = (session?.user as any)?.role;
  if (existing.authorId !== user.id && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, cost, prepTime, description, image, tagIds, ingredients, ingredientQuantities } = body;

    // Validate positive numbers
    const costNum = cost !== undefined ? Number(cost) : existing.cost;
    const prepNum = prepTime !== undefined ? Number(prepTime) : existing.prepTime;
    if (costNum < 0) {
      return NextResponse.json(
        { error: 'Cost must be a positive number' },
        { status: 400 },
      );
    }s
    if (prepNum < 0) {
      return NextResponse.json(
        { error: 'Prep time must be a positive number' },
        { status: 400 },
      );
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

    // Always disconnect all existing ingredients, then connect new ones (two-step update)
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

    // Rebuild ingredientQuantities to match ingredient order from the original submission
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating recipe:', err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to update recipe', details: errorMsg }, { status: 500 });
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
