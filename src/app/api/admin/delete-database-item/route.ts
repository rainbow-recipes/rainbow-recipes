import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session?.user?.email || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId } = await req.json();
  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  try {
    // Remove any StoreItems referencing this DatabaseItem to avoid FK violations
    await prisma.$transaction([
      prisma.storeItem.deleteMany({ where: { databaseItemId: Number(itemId) } }),
      prisma.databaseItem.delete({ where: { id: Number(itemId) } }),
    ]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error deleting database item', err);
    return NextResponse.json({ error: 'Failed to delete database item' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
