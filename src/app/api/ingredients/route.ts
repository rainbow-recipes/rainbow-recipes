import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const take = Number(url.searchParams.get('take') || 10);

    const qTrim = String(q).trim();
    if (!qTrim) return NextResponse.json([]);

    // Build OR filters: full-phrase match plus each significant token
    const tokens = qTrim.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    const ors: any[] = [];
    // full query first
    ors.push({ name: { contains: qTrim, mode: 'insensitive' } });
    // include token matches (limit tokens to avoid many clauses)
    tokens
      .filter((t) => t.length >= 2)
      .slice(0, 6)
      .forEach((t) => ors.push({ name: { contains: t, mode: 'insensitive' } }));

    const items = await prisma.databaseItem.findMany({
      where: { OR: ors },
      take: Math.max(1, take),
      orderBy: { name: 'asc' },
    });

    // dedupe by id (in case multiple clauses returned same item)
    const seen = new Set<number>();
    const deduped: typeof items = [] as any;
    for (const it of items) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        deduped.push(it);
      }
    }

    return NextResponse.json(deduped);
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
