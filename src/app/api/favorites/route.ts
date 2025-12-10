/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recipeId } = await req.json();

  if (!recipeId) {
    return NextResponse.json({ error: 'recipeId is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // toggle favorite
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_recipeId: {
        userId: user.id,
        recipeId: Number(recipeId),
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: {
        userId: user.id,
        recipeId: Number(recipeId),
      },
    });
  }

  const favoritesCount = await prisma.favorite.count({ where: { recipeId: Number(recipeId) } });

  return NextResponse.json({ favorited: !existing, favoritesCount });
}
