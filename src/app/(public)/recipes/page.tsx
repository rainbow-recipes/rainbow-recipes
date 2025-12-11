import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RecipeList from '@/components/recipes/RecipeList';
import { Row } from 'react-bootstrap';

export default async function RecipesPage() {
  const session = await getServerSession(authOptions);

  const [recipes, tags, allIngredients, userWithFavorites] = await Promise.all([
    prisma.recipe.findMany({
      include: {
        tags: true,
        ingredients: {
          select: { id: true, name: true, itemCategory: true },
        },
        author: {
          select: { id: true, firstName: true, lastName: true, name: true },
        },
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { favorites: true, reviews: true },
        },
      },
    }),
    prisma.tag.findMany(),
    prisma.databaseItem.findMany({
      select: { id: true, name: true, itemCategory: true },
    }),
    session?.user?.email
      ? prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          role: true,
          favorites: { select: { recipeId: true } },
        },
      })
      : null,
  ]);

  const favoriteIds = userWithFavorites?.favorites.map((f) => f.recipeId) ?? [];
  const isAdmin = userWithFavorites?.role === 'ADMIN';
  const currentUserId = userWithFavorites?.id;

  return (
    <div className="container my-4">
      <Row>
        <h2 className="mb-4">Recipes</h2>
      </Row>
      <RecipeList
        initialRecipes={recipes}
        allTags={tags}
        allIngredients={allIngredients}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        userEmail={session?.user?.email ?? undefined}
      />
    </div>
  );
}
