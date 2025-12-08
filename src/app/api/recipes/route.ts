import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { name, cost, prepTime, description, image, tagIds, ingredients, ingredientQuantities } = body;

    // Validate positive numbers
    const costNum = Number(cost) || 0;
    const prepNum = Number(prepTime) || 0;
    if (costNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Cost must be a positive number' },
        { status: 400 },
      );
    }
    if (prepNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Prep time must be a positive number' },
        { status: 400 },
      );
    }

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
        cost: costNum,
        prepTime: prepNum,
        description: description || '',
        image: image || null,
        ingredientQuantities: Array.isArray(ingredientQuantities) ? ingredientQuantities : [],
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
              ...(ingredientConnectOrCreate.length ? { connectOrCreate: ingredientConnectOrCreate } : {}),
            }
            : undefined,
      },
    });

    // Re-fetch to ensure we have ingredients in consistent order
    const createdRecipe = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: { ingredients: true },
    });

    // Rebuild ingredientQuantities to match ingredient order from the original submission
    if (createdRecipe && Array.isArray(ingredients)) {
      const ingredientIdMap = new Map<number, number>();
      ingredients.forEach((ing: any, idx: number) => {
        if (ing.id) {
          ingredientIdMap.set(ing.id, idx);
        }
      });

      // Create sorted quantities array matching the server-stored ingredient order
      const reorderedQuantities = (createdRecipe.ingredients || []).map((ing: any) => {
        const originalIdx = ingredientIdMap.get(ing.id);
        return originalIdx !== undefined && ingredientQuantities[originalIdx]
          ? ingredientQuantities[originalIdx]
          : '';
      });

      // Update with reordered quantities
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { ingredientQuantities: reorderedQuantities },
      });
    }

    return NextResponse.json({ success: true, id: recipe.id }, { status: 200 });
  } catch (err) {
    console.error('Error creating recipe:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 },
    );
  }
}
