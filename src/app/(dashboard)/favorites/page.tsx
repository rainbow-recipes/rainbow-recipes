import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import RecipeList from '@/components/recipes/RecipeList';

const prisma = new PrismaClient();

export default async function MyRecipesPage() {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  // Load data in parallel
  const [favorites, tags, allIngredients] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: (session?.user as any)?.id },
      include: {
        recipe: {
          include: {
            tags: true,
            ingredients: {
              select: { id: true, name: true, itemCategory: true },
            },
          },
        },
      },
    }),
    prisma.tag.findMany(),
    prisma.databaseItem.findMany({
      select: { id: true, name: true, itemCategory: true },
    }),
  ]);

  const favoriteRecipes = favorites.map(f => f.recipe);
  const favoriteIds = favoriteRecipes.map(recipe => recipe.id);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const currentUserId = (session?.user as any)?.id;

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Favorites</h2>
      <RecipeList
        initialRecipes={favoriteRecipes}
        allTags={tags}
        allIngredients={allIngredients}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}
