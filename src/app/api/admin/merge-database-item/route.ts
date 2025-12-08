import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user?.email || role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sourceId, targetId } = await req.json();

  if (!sourceId || !targetId) {
    return NextResponse.json({ error: 'sourceId and targetId are required' }, { status: 400 });
  }

  const src = Number(sourceId);
  const dest = Number(targetId);

  if (Number.isNaN(src) || Number.isNaN(dest)) {
    return NextResponse.json({ error: 'sourceId and targetId must be numbers' }, { status: 400 });
  }

  if (src === dest) {
    return NextResponse.json({ error: 'sourceId and targetId must be different' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [sourceItem, targetItem] = await Promise.all([
        tx.databaseItem.findUnique({ where: { id: src } }),
        tx.databaseItem.findUnique({ where: { id: dest } }),
      ]);

      if (!sourceItem || !targetItem) {
        throw new Error('Source or target item not found');
      }

      // Move store items to target
      await tx.storeItem.updateMany({
        where: { databaseItemId: src },
        data: { databaseItemId: dest },
      });

      // Update recipes that reference the source ingredient
      const recipes = await tx.recipe.findMany({
        where: { ingredients: { some: { id: src } } },
        include: { ingredients: { select: { id: true } } },
      });

      // Rewire ingredient lists to use the target and drop the source (avoid duplicates)
      // eslint-disable-next-line no-restricted-syntax
      for (const recipe of recipes) {
        const newIds = Array.from(new Set([
          ...recipe.ingredients.map((ing) => ing.id).filter((id) => id !== src),
          dest,
        ]));

        // eslint-disable-next-line no-await-in-loop
        await tx.recipe.update({
          where: { id: recipe.id },
          data: { ingredients: { set: newIds.map((id) => ({ id })) } },
        });
      }

      // Finally delete the source database item
      await tx.databaseItem.delete({ where: { id: src } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error merging database items', err);
    return NextResponse.json({ error: 'Failed to merge database items' }, { status: 500 });
  }
}
