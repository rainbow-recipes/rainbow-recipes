import { prisma } from '@/lib/prisma';
import ReviewRecipeForm from '@/components/recipes/reviews/ReviewRecipeForm';
import { getServerSession } from 'next-auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import notFound from '@/app/not-found';
import { Container, Alert } from 'react-bootstrap';
import Link from 'next/link';

export default async function ReviewRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  const recipeId = parseInt(resolvedParams.id, 10);
  if (Number.isNaN(recipeId)) {
    return notFound();
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
      name: true,
      authorId: true,
    },
  });

  if (!recipe) {
    return notFound();
  }

  // Prevent recipe author from reviewing their own recipe
  if (recipe.authorId === (session?.user as { id?: string })?.id) {
    return (
      <Container className="py-4">
        <h1>Review Recipe</h1>
        <p className="text-muted mb-4">
          Recipe:
          {' '}
          <Link href={`/recipes/${recipe.id}`} className="text-decoration-none fw-bold">
            {recipe.name}
          </Link>
        </p>
        <Alert variant="warning">
          You cannot review your own recipe.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1>Review Recipe</h1>
      <p className="text-muted mb-4">
        Recipe:
        {' '}
        <Link href={`/recipes/${recipe.id}`} className="text-decoration-none fw-bold">
          {recipe.name}
        </Link>
      </p>
      <ReviewRecipeForm recipeId={recipe.id} />
    </Container>
  );
}
