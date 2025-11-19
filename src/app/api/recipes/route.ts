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
    const { name, cost, prepTime, description, image, tagIds } = body;

    const recipe = await prisma.recipe.create({
      data: {
        name: name || '(Untitled)',
        cost: Number(cost) || 0,
        prepTime: Number(prepTime) || 0,
        description: description || '',
        image: image || null,
        authorId: user.id,
        tags:
          tagIds && tagIds.length
            ? { connect: tagIds.map((id: number) => ({ id: Number(id) })) }
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
