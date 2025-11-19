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

  // Recipes created by this user
  const myRecipes = await prisma.recipe.findMany({
    where: { authorId: user.id },
    include: { tags: true },
    orderBy: { name: 'asc' },
  });

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
      <h2 className="mb-4">My Recipes</h2>

      {/* Recipes created by user */}
      <section className="mb-5">
        <h4 className="mb-3">Recipes you added</h4>
        {myRecipes.length === 0 ? (
          <p className="text-muted">You haven&apos;t added any recipes yet.</p>
        ) : (
          <div className="row">
            {myRecipes.map((recipe) => (
              <div key={recipe.id} className="col-md-4 mb-4">
                <div className="card h-100 rounded-4 border-2">
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      className="card-img-top"
                      alt={recipe.name}
                      style={{ objectFit: 'cover', maxHeight: '180px' }}
                    />
                  ) : (
                    <div className="card-img-top bg-secondary text-light p-5 text-center rounded-top-4">
                      No image
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{recipe.name}</h5>
                    <p className="card-text mb-2">
                      Prep time:
                      {' '}
                      {recipe.prepTime}
                      {' '}
                      min
                      <br />
                      Cost: $
                      {recipe.cost.toFixed(2)}
                    </p>
                    <div className="mt-auto">
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="badge bg-light text-dark border me-1"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Favorited recipes (client component so we can untoggle) */}
      <FavoriteRecipesSection initialFavorites={favoriteRecipes} />
    </div>
  );
}
