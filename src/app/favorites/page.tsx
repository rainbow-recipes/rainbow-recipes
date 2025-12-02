import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RecipeList from '@/components/RecipeList';

const prisma = new PrismaClient();

export default async function MyRecipesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect('/signin');
  }
  // Load data in parallel
  const [favorites, tags] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: user.id },
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
  const isAdmin = (session.user as any)?.role === 'ADMIN';

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
