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
  const [myRecipes, tags, favorites] = await Promise.all([
    prisma.recipe.findMany({
      where: { authorId: user.id },
      include: { tags: true },
      orderBy: { name: 'asc' },
    }),
    prisma.tag.findMany(),
    prisma.favorite.findMany({
      where: { userId: user.id },
      select: { recipeId: true },
    }),
  ]);

  const favoriteIds = favorites.map(f => f.recipeId);
  const isAdmin = (session.user as any)?.role === 'ADMIN';

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Recipes</h2>
      <RecipeList
        initialRecipes={myRecipes}
        allTags={tags}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
      />
    </div>
  );
}
