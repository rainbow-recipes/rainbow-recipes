import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns store info for map/list usage
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        website: true,
        location: true, // ✅ address string from schema
        hours: true,
        image: true,
        owner: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ stores });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load stores' },
      { status: 500 },
    );
  }
}
