import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session?.user?.email || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId, name, itemCategory } = await req.json();

  if (!itemId || !name || !itemCategory) {
    return NextResponse.json({ error: 'itemId, name and itemCategory are required' }, { status: 400 });
  }

  try {
    const updated = await prisma.databaseItem.update({
      where: { id: Number(itemId) },
      data: { name, itemCategory },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'A database item with that name already exists.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to update item.' }, { status: 500 });
  }
}
