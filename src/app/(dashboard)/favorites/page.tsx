import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import RecipeList from '@/components/RecipeList';

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
  const [favorites, tags] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: (session?.user as any)?.id },
      include: {
        recipe: {
          include: { tags: true },
        },
      },
    }),
    prisma.tag.findMany(),
  ]);

  const favoriteRecipes = favorites.map(f => f.recipe);
  const favoriteIds = favoriteRecipes.map(recipe => recipe.id);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Favorites</h2>
      <RecipeList
        initialRecipes={favoriteRecipes}
        allTags={tags}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
      />
    </div>
  );
}
