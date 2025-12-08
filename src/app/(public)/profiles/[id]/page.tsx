import { Container } from 'react-bootstrap';
import { ChevronLeft, PersonCircle } from 'react-bootstrap-icons';
import Link from 'next/link';
import Image from 'next/image';
import notFound from '@/app/not-found';
import { prisma } from '@/lib/prisma';
import RecipeList from '@/components/RecipeList';

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const userId = String(params.id);

  // Fetch user with their public recipes and favorites count
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      recipes: {
        orderBy: { id: 'desc' },
        include: {
          tags: true,
          favorites: true,
          author: {
            select: { id: true, firstName: true, lastName: true, name: true },
          },
        },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.name || 'Unknown User';

  const recipeCount = user.recipes.length;
  const totalFavorites = user.recipes.reduce((sum, recipe) => sum + recipe.favorites.length, 0);
  const joinDate = user.emailVerified ? user.emailVerified.toLocaleDateString() : null;

  return (
    <Container className="py-4">
      {/* Back navigation */}
      <Link href="/recipes" className="text-decoration-none text-dark mb-3 d-inline-flex align-items-center">
        <ChevronLeft className="me-1" />
        Back to Recipes
      </Link>

      {/* Profile Header */}
      <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded">
        {user.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={100}
            height={100}
            className="rounded-circle"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <PersonCircle size={100} className="text-secondary" />
        )}
        <div>
          <h2 className="mb-1">{displayName}</h2>
          {joinDate && (
            <p className="text-muted mb-1">
              Joined:
              {' '}
              {joinDate}
            </p>
          )}
          <p className="text-muted mb-0">
            {recipeCount}
            {' '}
            published
            {' '}
            {recipeCount === 1 ? 'recipe' : 'recipes'}
            {' '}
            ·
            {' '}
            {totalFavorites}
            {' '}
            total
            {' '}
            {totalFavorites === 1 ? 'favorite' : 'favorites'}
          </p>
        </div>
      </div>

      {/* Recipes Section */}
      <h3 className="mb-3">
        Recipes by
        {' '}
        {user.firstName || displayName}
      </h3>
      {user.recipes.length === 0 ? (
        <p className="text-muted">This user hasn&apos;t shared any recipes yet.</p>
      ) : (
        <RecipeList
          initialRecipes={user.recipes}
          allTags={[]}
          initialFavoriteIds={[]}
          currentUserId={undefined}
          isAdmin={false}
          mode="publicProfile"
        />
      )}
    </Container>
  );
}
