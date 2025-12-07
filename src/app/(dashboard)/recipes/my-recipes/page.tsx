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
  const [myRecipes, tags, favorites] = await Promise.all([
    prisma.recipe.findMany({
      where: { authorId: (session?.user as any)?.id },
      include: { tags: true },
      orderBy: { name: 'asc' },
    }),
    prisma.tag.findMany(),
    prisma.favorite.findMany({
      where: { userId: (session?.user as any)?.id },
      select: { recipeId: true },
    }),
  ]);

  const favoriteIds = favorites.map(f => f.recipeId);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const currentUserId = (session?.user as any)?.id;

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Recipes</h2>
      <RecipeList
        initialRecipes={myRecipes}
        allTags={tags}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}
