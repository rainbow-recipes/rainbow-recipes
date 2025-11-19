// src/app/recipes/page.tsx

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RecipeList from '@/components/RecipeList';

const prisma = new PrismaClient();

export default async function RecipesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const [recipes, tags] = await Promise.all([
    prisma.recipe.findMany({ include: { tags: true } }),
    prisma.tag.findMany(),
  ]);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  let favoriteIds: number[] = [];
  if (user) {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: { recipeId: true },
    });
    favoriteIds = favorites.map((f) => f.recipeId);
  }

  const isAdmin = (session.user as any)?.role === 'ADMIN';

  return (
    <div className="container my-4">
      <h2 className="mb-4">Recipes</h2>
      <RecipeList
        initialRecipes={recipes}
        allTags={tags}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
      />
    </div>
  );
}
