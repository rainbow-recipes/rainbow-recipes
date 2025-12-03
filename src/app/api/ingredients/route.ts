/* eslint-disable import/prefer-default-export */
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma, DatabaseItem } from '@prisma/client';

// Lazily initialize Prisma to avoid any module-evaluation side effects
let prisma: PrismaClient | null = null;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function GET(request: Request) {
  // Guard: when Next performs static analyses or when the handler is
  // executed in a context without a request URL, avoid calling
  // `new URL(request.url)` which can throw or be undefined during build.
  if (!request || !request.url) {
    // Return empty result during static evals or malformed calls.
    return NextResponse.json([]);
  }

  try {
    let url: URL;
    try {
      url = new URL(request.url);
    } catch (e) {
      // If parsing fails, respond with empty set rather than throwing
      console.error('Invalid request.url in ingredients handler:', e);
      return NextResponse.json([]);
    }

    const q = url.searchParams.get('q') || '';
    const take = Number(url.searchParams.get('take') || 10);

    const qTrim = String(q).trim();
    if (!qTrim) return NextResponse.json([]);

    // Build OR filters: full-phrase match plus each significant token
    const tokens = qTrim.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    const ors: Prisma.DatabaseItemWhereInput[] = [];
    // full query first
    ors.push({ name: { contains: qTrim, mode: 'insensitive' } });
    // include token matches (limit tokens to avoid many clauses)
    tokens
      .filter((t) => t.length >= 2)
      .slice(0, 6)
      .forEach((t) => ors.push({ name: { contains: t, mode: 'insensitive' } }));

    const db = getPrisma();
    const items = await db.databaseItem.findMany({
      where: { OR: ors },
      take: Math.max(1, take),
      orderBy: { name: 'asc' },
    });

    // dedupe by id (in case multiple clauses returned same item)
    const seen = new Set<number>();
    const deduped: DatabaseItem[] = [];
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
