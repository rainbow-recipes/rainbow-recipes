import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// eslint-disable-next-line import/prefer-default-export
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewId = parseInt(params.id, 10);
    if (Number.isNaN(reviewId)) {
      return Response.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    // Fetch the review to check ownership
    const review = await prisma.recipeReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user is the owner or an admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (review.owner !== session.user.email && user.role !== 'ADMIN') {
      return Response.json(
        { error: 'You do not have permission to delete this review' },
        { status: 403 },
      );
    }

    // Delete the review
    await prisma.recipeReview.delete({
      where: { id: reviewId },
    });

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting review:', err);
    return Response.json(
      { error: err.message || 'Failed to delete review' },
      { status: 500 },
    );
  }
}
