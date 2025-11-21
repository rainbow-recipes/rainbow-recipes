'use client';

import { useState } from 'react';
import type { Recipe, Tag } from '@prisma/client';

type RecipeWithTags = Recipe & { tags: Tag[] };

interface FavoriteRecipesSectionProps {
  initialFavorites: RecipeWithTags[];
}

const FavoriteRecipesSection = ({ initialFavorites }: FavoriteRecipesSectionProps) => {
  const [favorites, setFavorites] = useState<RecipeWithTags[]>(initialFavorites);

  const handleToggleFavorite = async (recipeId: number) => {
    // Optimistic: remove from UI immediately
    setFavorites((prev) => prev.filter((r) => r.id !== recipeId));

    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });
    } catch (err) {
      console.error('Failed to toggle favorite from profile page:', err);
      // If you want, you could revert the state here on error
      // but for now we just log it.
    }
  };

  return (
    <section>
      <h4 className="mb-3">Your favorites</h4>
      {favorites.length === 0 ? (
        <p className="text-muted">You haven&apos;t favorited any recipes yet.</p>
      ) : (
        <div className="row">
          {favorites.map((recipe) => (
            <div key={recipe.id} className="col-md-4 mb-4">
              <div className="card h-100 rounded-4 border-2">
                {recipe.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
                  {/* Title + heart (button) side by side */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{recipe.name}</h5>
                    <button
                      type="button"
                      className="btn btn-link p-0 border-0"
                      onClick={() => handleToggleFavorite(recipe.id)}
                      aria-label="Remove from favorites"
                    >
                      <span style={{ fontSize: '1.4rem' }}>♥</span>
                    </button>
                  </div>

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
  );
};

export default FavoriteRecipesSection;
