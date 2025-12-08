import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId, rating, review } = body;

    if (!recipeId || !rating || !review) {
      return Response.json(
        { error: 'Missing required fields: recipeId, rating, review' },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 },
      );
    }

    if (review.trim().length < 10) {
      return Response.json(
        { error: 'Review must be at least 10 characters' },
        { status: 400 },
      );
    }

    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!recipe) {
      return Response.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Prevent recipe author from reviewing their own recipe
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (recipe.authorId === user?.id) {
      return Response.json({ error: 'You cannot review your own recipe' }, { status: 403 });
    }

    // Create the review
    const newReview = await prisma.recipeReview.create({
      data: {
        recipeId,
        rating,
        review: review.trim(),
        owner: session.user.email,
      },
    });

    return Response.json(newReview, { status: 201 });
  } catch (err: any) {
    console.error('Error creating review:', err);
    return Response.json(
      { error: err.message || 'Failed to create review' },
      { status: 500 },
    );
  }
}
