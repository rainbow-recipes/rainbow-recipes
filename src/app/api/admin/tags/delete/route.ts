import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  // Only admins can delete tags
  if (!session?.user?.email || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    await prisma.tag.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      // Record not found
      return NextResponse.json({ error: 'Tag not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete tag.' }, { status: 500 });
  }
}
