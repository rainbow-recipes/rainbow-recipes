// src/app/recipes/page.tsx

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RecipeList from '@/components/recipes/RecipeList';
import { Row } from 'react-bootstrap';

const prisma = new PrismaClient();

export default async function RecipesPage() {
  const session = await getServerSession(authOptions);

  const [recipes, tags, allIngredients] = await Promise.all([
    prisma.recipe.findMany({
      include: {
        tags: true,
        ingredients: {
          select: { id: true, name: true, itemCategory: true },
        },
        author: {
          select: { id: true, firstName: true, lastName: true, name: true },
        },
      },
    }),
    prisma.tag.findMany(),
    prisma.databaseItem.findMany({
      select: { id: true, name: true, itemCategory: true },
    }),
  ]);

  let favoriteIds: number[] = [];
  let isAdmin = false;
  let currentUserId: string | number | undefined;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (user) {
      currentUserId = user.id;
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
        allIngredients={allIngredients}
        initialFavoriteIds={favoriteIds}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}
