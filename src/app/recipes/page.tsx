// src/app/recipes/page.tsx

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RecipeList from '@/components/RecipeList';
import { Row } from 'react-bootstrap';

const prisma = new PrismaClient();

export default async function RecipesPage() {
  const session = await getServerSession(authOptions);

  const [recipes, tags] = await Promise.all([
    prisma.recipe.findMany({ include: { tags: true } }),
    prisma.tag.findMany(),
  ]);

  let favoriteIds: number[] = [];
  let isAdmin = false;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (user) {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { recipeId: true },
      });
      favoriteIds = favorites.map((f) => f.recipeId);
    }

    isAdmin = (session.user as any)?.role === 'ADMIN';
  }

  return (
    <div className="container my-4">
      <Row>
        <h2 className="mb-4">Recipes</h2>
      </Row>
      <RecipeList
        initialRecipes={recipes}
        allTags={tags}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
      />
    </div>
  );
}
