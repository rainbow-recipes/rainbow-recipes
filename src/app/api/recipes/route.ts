import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    include: { tags: true },
  });
  return NextResponse.json(recipes);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, cost, prepTime, description, image, tagIds, ingredients } = body;

    // prepare nested write payload for ingredients (connect existing by id or connectOrCreate by name)
    const ingredientConnect: Array<{ id: number }> = [];
    const ingredientConnectOrCreate: Array<any> = [];
    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        if (ing && typeof ing === 'object' && Number(ing.id)) {
          ingredientConnect.push({ id: Number(ing.id) });
        } else if (ing && typeof ing === 'object' && ing.name) {
          const category = ing.itemCategory && typeof ing.itemCategory === 'string'
            ? String(ing.itemCategory)
            : 'other';
          const cleaned = String(ing.name).trim().replace(/\s+/g, ' ');
          ingredientConnectOrCreate.push({
            where: { name: cleaned },
            create: { name: cleaned, itemCategory: category },
          });
        }
      }
    }

    const recipe = await prisma.recipe.create({
      data: {
        name: name || '(Untitled)',
        cost: Number(cost) || 0,
        prepTime: Number(prepTime) || 0,
        description: description || '',
        image: image || null,
        // set relation via nested connect so Prisma accepts it
        author: { connect: { id: user.id } },
        tags:
          tagIds && tagIds.length
            ? { connect: tagIds.map((id: number) => ({ id: Number(id) })) }
            : undefined,
        ingredients:
          (ingredientConnect.length || ingredientConnectOrCreate.length)
            ? {
              ...(ingredientConnect.length ? { connect: ingredientConnect } : {}),
              ...(ingredientConnectOrCreate.length
                ? { connectOrCreate: ingredientConnectOrCreate }
                : {}),
            }
            : undefined,
      },
    });

    return NextResponse.json({ success: true, id: recipe.id }, { status: 200 });
  } catch (err) {
    console.error('Error creating recipe:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 },
    );
  }
}
