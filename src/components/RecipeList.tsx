'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Recipe, Tag } from '@prisma/client';

type RecipeWithTags = Recipe & { tags: Tag[] };

interface RecipeListProps {
  initialRecipes: RecipeWithTags[];
  allTags: Tag[];
  initialFavoriteIds: number[];
  isAdmin: boolean;
  showSearch?: boolean;
}

function RecipeList({
  initialRecipes,
  allTags,
  initialFavoriteIds,
  isAdmin,
  showSearch,
}: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeWithTags[]>(initialRecipes);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlFoodType = searchParams.get('foodType');
  const urlAppliance = searchParams.get('appliance');

  const dietTags = useMemo(() => allTags.filter((t) => t.category === 'Diet'), [allTags]);
  const applianceTags = useMemo(() => allTags.filter((t) => t.category === 'Appliance'), [allTags]);

  // Helper function to find tag IDs by name
  const getTagIdsByName = (tagName: string, tagList: Tag[]) => {
    const normalizeString = (str: string) => str.toLowerCase().replace('-', '').replace(' ', '');
    const matchedTags = tagList.filter((tag) => normalizeString(tag.name) === normalizeString(tagName));
    return matchedTags.map((tag) => tag.id);
  };

  // Initialize state without dependencies on initial props
  const [selectedDietTags, setSelectedDietTags] = useState<number[]>([]);
  const [selectedApplianceTags, setSelectedApplianceTags] = useState<number[]>([]);
  const [maxPrepTime, setMaxPrepTime] = useState<number | undefined>();
  const [maxCost, setMaxCost] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<number[]>(initialFavoriteIds);

  // State for collapsible sections
  const [foodTypeOpen, setFoodTypeOpen] = useState(false);
  const [applianceOpen, setApplianceOpen] = useState(false);

  // Reactively handle URL parameter changes
  useEffect(() => {
    // Handle food type filter
    if (urlFoodType) {
      const ids = getTagIdsByName(urlFoodType, dietTags);
      setSelectedDietTags(ids);
      setFoodTypeOpen(true);
    } else {
      setSelectedDietTags([]);
      setFoodTypeOpen(false);
    }

    // Handle appliance filter
    if (urlAppliance) {
      const ids = getTagIdsByName(urlAppliance, applianceTags);
      setSelectedApplianceTags(ids);
      setApplianceOpen(true);
    } else {
      setSelectedApplianceTags([]);
      setApplianceOpen(false);
    }
  }, [urlFoodType, urlAppliance, dietTags, applianceTags]);

  const filteredRecipes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return recipes.filter((recipe) => {
      if (term) {
        const inName = recipe.name.toLowerCase().includes(term);
        const inDesc = recipe.description.toLowerCase().includes(term);
        if (!inName && !inDesc) return false;
      }

      if (maxPrepTime !== undefined && recipe.prepTime > maxPrepTime) return false;
      if (maxCost !== undefined && recipe.cost > maxCost) return false;

      if (selectedDietTags.length > 0) {
        const recipeDietIds = recipe.tags
          .filter((t) => t.category === 'Diet')
          .map((t) => t.id);
        const hasDiet = selectedDietTags.some((id) => recipeDietIds.includes(id));
        if (!hasDiet) return false;
      }

      if (selectedApplianceTags.length > 0) {
        const recipeApplianceIds = recipe.tags
          .filter((t) => t.category === 'Appliance')
          .map((t) => t.id);
        const hasAppliance = selectedApplianceTags.some((id) => recipeApplianceIds.includes(id));
        if (!hasAppliance) return false;
      }

      return true;
    });
  }, [
    recipes,
    maxPrepTime,
    maxCost,
    selectedDietTags,
    selectedApplianceTags,
    searchTerm,
  ]);

  const toggleDiet = (id: number) => {
    setSelectedDietTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAppliance = (id: number) => {
    setSelectedApplianceTags((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleFavorite = async (recipeId: number) => {
    // optimistic UI
    setFavoriteIds((prev) => (prev.includes(recipeId)
      ? prev.filter((id) => id !== recipeId)
      : [...prev, recipeId]));

    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });
    } catch (err) {
      console.error(err);
      // could revert state here if needed
    }
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!isAdmin) return;

    const prevRecipes = recipes;
    // optimistic remove
    setRecipes((current) => current.filter((r) => r.id !== recipeId));

    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.error('Failed to delete recipe');
        setRecipes(prevRecipes); // revert on failure
      }
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setRecipes(prevRecipes); // revert on error
    }
  };

  return (
    <>
      {showSearch && (
        <>
          {/* Top bar: search + add button */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="flex-grow-1">
              <input
                type="text"
                className="form-control form-control-lg rounded-pill px-4"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {pathname === '/recipes' && (
              <div>
                <Link href="/add-recipe" className="btn btn-outline-dark btn-lg rounded-pill">
                  Add Recipe
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main layout: left filter column + right cards */}
      <div className="row">
        {/* Filter column */}
        <div className="col-md-3 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <h4 className="mb-0 me-2">Filter</h4>
                <span className="ms-auto">
                  <span className="d-block" style={{ width: 18, borderTop: '2px solid #000' }} />
                  <span
                    className="d-block mt-1"
                    style={{ width: 12, borderTop: '2px solid #000', marginLeft: 6 }}
                  />
                </span>
              </div>

              {/* Food Type */}
              <details open={foodTypeOpen} className="mb-2">
                <summary
                  className="fw-semibold mb-1"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setFoodTypeOpen(!foodTypeOpen);
                  }}
                >
                  Food Type
                </summary>
                {dietTags.length === 0 && (
                  <div className="text-muted small">(no diet tags yet)</div>
                )}
                {dietTags.map((tag) => (
                  <div key={tag.id} className="form-check">
                    <input
                      id={`diet-${tag.id}`}
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedDietTags.includes(tag.id)}
                      onChange={() => toggleDiet(tag.id)}
                    />
                    <label htmlFor={`diet-${tag.id}`} className="form-check-label">
                      {tag.name}
                    </label>
                  </div>
                ))}
              </details>

              {/* Appliances */}
              <details open={applianceOpen} className="mb-2">
                <summary
                  className="fw-semibold mb-1"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setApplianceOpen(!applianceOpen);
                  }}
                >
                  Appliances
                </summary>
                {applianceTags.length === 0 && (
                  <div className="text-muted small">(no appliance tags yet)</div>
                )}
                {applianceTags.map((tag) => (
                  <div key={tag.id} className="form-check">
                    <input
                      id={`app-${tag.id}`}
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedApplianceTags.includes(tag.id)}
                      onChange={() => toggleAppliance(tag.id)}
                    />
                    <label htmlFor={`app-${tag.id}`} className="form-check-label">
                      {tag.name}
                    </label>
                  </div>
                ))}
              </details>

              {/* Cost */}
              <details className="mb-2">
                <summary className="fw-semibold mb-1" style={{ cursor: 'pointer' }}>
                  Cost
                </summary>
                <div className="d-flex align-items-center">
                  <span className="me-2 small text-muted">Max</span>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={maxCost ?? ''}
                    onChange={(e) => setMaxCost(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="$"
                  />
                </div>
              </details>

              {/* Prep time */}
              <details className="mb-2">
                <summary className="fw-semibold mb-1" style={{ cursor: 'pointer' }}>
                  Prep Time
                </summary>
                <div className="d-flex align-items-center">
                  <span className="me-2 small text-muted">Max (min)</span>
                  <input
                    type="number"
                    className="form-control"
                    value={maxPrepTime ?? ''}
                    onChange={(e) => setMaxPrepTime(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="minutes"
                  />
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Cards column */}
        <div className="col-md-9">
          {filteredRecipes.length === 0 ? (
            <p>No recipes match these filters.</p>
          ) : (
            <div className="row">
              {filteredRecipes.map((recipe) => {
                const isFavorite = favoriteIds.includes(recipe.id);
                return (
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
                        {/* Title + heart row */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title mb-0">{recipe.name}</h5>
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0"
                            onClick={() => toggleFavorite(recipe.id)}
                            aria-label={
                              isFavorite ? 'Remove from favorites' : 'Add to favorites'
                            }
                          >
                            <span style={{ fontSize: '1.4rem' }}>
                              {isFavorite ? '♥' : '♡'}
                            </span>
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
                        <div className="mt-auto d-flex justify-content-between align-items-end">
                          <div>
                            {recipe.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="badge bg-light text-dark border me-1"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger ms-2"
                              onClick={() => handleDeleteRecipe(recipe.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

RecipeList.defaultProps = {
  showSearch: true,
};

export default RecipeList;
