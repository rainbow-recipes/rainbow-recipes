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
    const { storeId, rating, review } = body;

    if (!storeId || !rating || !review) {
      return Response.json(
        { error: 'Missing required fields: storeId, rating, review' },
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

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: String(storeId) },
      select: {
        id: true,
        owner: true,
      },
    });

    if (!store) {
      return Response.json({ error: 'Store not found' }, { status: 404 });
    }

    // Prevent store owner from reviewing their own store
    if (store.owner === session.user.email) {
      return Response.json({ error: 'You cannot review your own store' }, { status: 403 });
    }

    // Create the review
    const newReview = await prisma.vendorReview.create({
      data: {
        storeId: store.id,
        rating,
        review: review.trim(),
        owner: session.user.email,
      },
    });

    return Response.json(newReview, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vendor review:', error);
    return Response.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
