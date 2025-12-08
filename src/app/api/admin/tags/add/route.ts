import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  // Only admins can add tags
  if (!session?.user?.email || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, category } = await req.json();

  if (!name || !category) {
    return NextResponse.json({ error: 'name and category are required' }, { status: 400 });
  }

  if (category !== 'Diet' && category !== 'Appliance') {
    return NextResponse.json({ error: 'category must be "Diet" or "Appliance"' }, { status: 400 });
  }

  try {
    const created = await prisma.tag.create({
      data: {
        name: String(name).trim(),
        category: String(category),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Unique constraint violation (duplicate name)
      return NextResponse.json(
        { error: 'A tag with that name already exists.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to create tag.' }, { status: 500 });
  }
}
