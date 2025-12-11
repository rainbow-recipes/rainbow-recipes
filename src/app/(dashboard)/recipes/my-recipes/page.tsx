import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import RecipeList from '@/components/recipes/RecipeList';

export default async function MyRecipesPage() {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  const userEmail = session?.user?.email!;
  const currentUser = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });
  const currentUserId = currentUser?.id;
  const isAdmin = currentUser?.role === 'ADMIN';

  const [myRecipes, tags, allIngredients, favorites] = await Promise.all([
    prisma.recipe.findMany({
      where: { authorId: currentUserId },
      include: {
        tags: true,
        ingredients: {
          select: { id: true, name: true, itemCategory: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.tag.findMany(),
    prisma.databaseItem.findMany({
      select: { id: true, name: true, itemCategory: true },
    }),
    prisma.favorite.findMany({
      where: { userId: currentUserId },
      select: { recipeId: true },
    }),
  ]);

  const favoriteIds = favorites.map((f) => f.recipeId);

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Recipes</h2>
      <RecipeList
        initialRecipes={myRecipes}
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
