import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Allow authenticated users (merchants and admins) to create database items
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, ItemCategory, approved } = await req.json();

  if (!name || !ItemCategory) {
    return NextResponse.json({ error: 'name and ItemCategory are required' }, { status: 400 });
  }

  try {
    const created = await prisma.databaseItem.create({
      data: {
        name: String(name).trim(),
        itemCategory: String(ItemCategory).toLowerCase() as any,
        approved: approved === true, // Default to false if not specified
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Unique constraint violation (duplicate name)
      return NextResponse.json(
        { error: 'A database item with that name already exists.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to create item.' }, { status: 500 });
  }
}
