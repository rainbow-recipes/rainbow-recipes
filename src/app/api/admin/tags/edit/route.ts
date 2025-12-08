import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  // Only admins can edit tags
  if (!session?.user?.email || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, name, category } = await req.json();

  if (!id || !name || !category) {
    return NextResponse.json({ error: 'id, name, and category are required' }, { status: 400 });
  }

  if (category !== 'Diet' && category !== 'Appliance') {
    return NextResponse.json({ error: 'category must be "Diet" or "Appliance"' }, { status: 400 });
  }

  try {
    const updated = await prisma.tag.update({
      where: { id: Number(id) },
      data: {
        name: String(name).trim(),
        category: String(category),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        // Unique constraint violation (duplicate name)
        return NextResponse.json(
          { error: 'A tag with that name already exists.' },
          { status: 409 },
        );
      }
      if (err.code === 'P2025') {
        // Record not found
        return NextResponse.json({ error: 'Tag not found.' }, { status: 404 });
      }
    }
    return NextResponse.json({ error: 'Failed to update tag.' }, { status: 500 });
  }
}
