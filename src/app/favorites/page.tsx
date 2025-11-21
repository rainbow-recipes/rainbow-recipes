/* eslint-disable @next/next/no-img-element */
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FavoriteRecipesSection from '@/components/FavoriteRecipesSection';

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
  // Recipes favorited by this user
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      recipe: {
        include: { tags: true },
      },
    },
  });

  // Extract recipes (and dedupe by id in case they created + favorited)
  // eslint-disable-next-line no-spaced-func
  const favoriteRecipesMap = new Map<number, (typeof favorites)[number]['recipe']>();
  for (const f of favorites) {
    favoriteRecipesMap.set(f.recipe.id, f.recipe);
  }
  const favoriteRecipes = Array.from(favoriteRecipesMap.values());

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Favorites</h2>
      {/* Favorited recipes (client component so we can untoggle) */}
      <FavoriteRecipesSection initialFavorites={favoriteRecipes} />
    </div>
  );
}
