/* eslint-disable import/prefer-default-export */
// src/app/api/recipes/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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
