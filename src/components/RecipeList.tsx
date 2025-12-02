/* eslint-disable max-len */

'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { Recipe, Tag } from '@prisma/client';
import { Card } from 'react-bootstrap';
import { SuitHeart, SuitHeartFill } from 'react-bootstrap-icons';
import defaultRecipeImage from '../../public/default-recipe-image.png';

type RecipeWithTags = Recipe & { tags: Tag[] };

interface RecipeListProps {
  initialRecipes: RecipeWithTags[];
  allTags: Tag[];
  initialFavoriteIds: number[];
  isAdmin: boolean;
  // the currently signed-in user's id (optional) - may be string or number depending on auth
  // eslint-disable-next-line react/require-default-props
  currentUserId?: string | number;
  // eslint-disable-next-line react/require-default-props
  showSearch?: boolean;
}

function RecipeList({
  initialRecipes,
  allTags,
  initialFavoriteIds,
  isAdmin,
  currentUserId,
  showSearch = true,
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
  const [sortOption, setSortOption] = useState('none');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

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

    const result = [...recipes].filter((recipe) => {
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

    // Apply sorting
    switch (sortOption) {
      case 'cost-asc':
        result.sort((a, b) => a.cost - b.cost);
        break;
      case 'cost-desc':
        result.sort((a, b) => b.cost - a.cost);
        break;
      case 'prep-asc':
        result.sort((a, b) => a.prepTime - b.prepTime);
        break;
      case 'prep-desc':
        result.sort((a, b) => b.prepTime - a.prepTime);
        break;
      case 'alpha-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'alpha-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'favorites-first':
        result.sort((a, b) => {
          const aFav = favoriteIds.includes(a.id) ? 1 : 0;
          const bFav = favoriteIds.includes(b.id) ? 1 : 0;
          return bFav - aFav;
        });
        break;
      default:
        // No sorting applied
        break;
    }

    return result;
  }, [
    recipes,
    maxPrepTime,
    maxCost,
    selectedDietTags,
    selectedApplianceTags,
    searchTerm,
    sortOption,
    favoriteIds,
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
          {/* Top bar: search + sort + add recipe */}
          <div className="row align-items-center mb-4 g-3">
            {/* Search bar - full width on mobile, grows on desktop */}
            <div className="col-12 col-md">
              <input
                type="text"
                className="form-control form-control-lg rounded-pill px-4"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort and Add Recipe controls - centered on mobile, right-aligned on desktop */}
            <div className="col-12 col-md-auto">
              <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-2">
                {/* Sort dropdown with proper positioning */}
                <div ref={sortDropdownRef} style={{ position: 'relative' }}>
                  <button
                    className={`btn btn-outline-secondary dropdown-toggle 
                      d-flex align-items-center justify-content-center`}
                    type="button"
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    aria-expanded={isSortOpen}
                    aria-label="Sort options"
                  >
                    <i className="bi bi-arrow-down-up" />
                  </button>
                  {isSortOpen && (
                    <ul
                      className="dropdown-menu show"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 2000,
                        minWidth: '200px',
                      }}
                    >
                      <li><h6 className="dropdown-header">Sort By Cost</h6></li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setSortOption('cost-asc');
                            setIsSortOpen(false);
                          }}
                        >
                          Cost: Low → High
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setSortOption('cost-desc');
                            setIsSortOpen(false);
                          }}
                        >
                          Cost: High → Low
                        </button>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      <li><h6 className="dropdown-header">Sort By Prep Time</h6></li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setSortOption('prep-asc');
                            setIsSortOpen(false);
                          }}
                        >
                          Prep Time: Low → High
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setSortOption('prep-desc');
                            setIsSortOpen(false);
                          }}
                        >
                          Prep Time: High → Low
                        </button>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      <li><h6 className="dropdown-header">Alphabetical</h6></li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setSortOption('alpha-asc');
                            setIsSortOpen(false);
                          }}
                        >
                          A → Z
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setSortOption('alpha-desc');
                            setIsSortOpen(false);
                          }}
                        >
                          Z → A
                        </button>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      <li><h6 className="dropdown-header">Favorites</h6></li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => {
                            setSortOption('favorites-first');
                            setIsSortOpen(false);
                          }}
                        >
                          Favorites First
                        </button>
                      </li>
                    </ul>
                  )}
                </div>

                {/* Add Recipe button - only on /recipes page */}
                {pathname === '/recipes' && (
                  <Link href="/add-recipe" className="btn btn-outline-dark btn-lg rounded-pill">
                    Add Recipe
                  </Link>
                )}
              </div>
            </div>
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
                // recipe.authorId may be string | null depending on Prisma schema; coerce for comparison
                const isOwner = recipe.authorId != null && String(currentUserId) === String(recipe.authorId);

                return (
                  <div key={recipe.id} className="col-md-4 mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                      {recipe.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <Card.Img
                          src={recipe.image}
                          variant="top"
                          alt={recipe.name}
                          style={{ objectFit: 'cover', maxHeight: '180px' }}
                        />
                      ) : (
                        <Card.Img
                          src={defaultRecipeImage.src}
                          variant="top"
                          alt={recipe.name}
                          style={{ objectFit: 'cover', maxHeight: '180px' }}
                        />
                      )}

                      <Card.Body>
                        {/* Title + heart row */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title mb-0">
                            <Link href={`selected-recipe/${recipe.id}`}>
                              <h5 className="card-title">{recipe.name}</h5>
                            </Link>
                          </h5>
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0"
                            onClick={() => toggleFavorite(recipe.id)}
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <span style={{ fontSize: '1.4rem' }}>
                              {isFavorite ? <SuitHeartFill /> : <SuitHeart />}
                            </span>
                          </button>
                        </div>

                        <Card.Text className="mb-2">
                          Prep time:
                          {' '}
                          {recipe.prepTime}
                          {' '}
                          min
                          <br />
                          Cost: $
                          {recipe.cost.toFixed(2)}
                        </Card.Text>

                        <div className="mt-auto d-flex justify-content-between align-items-end">
                          <div>
                            {recipe.tags.map((tag) => (
                              <span key={tag.id} className="badge bg-light text-dark border me-1">{tag.name}</span>
                            ))}
                          </div>

                          {(isAdmin || isOwner) && (
                            <Link href={`/recipes/${recipe.id}/edit`} className="btn btn-sm btn-outline-primary ms-2">
                              Edit
                            </Link>
                          )}

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
                      </Card.Body>
                    </Card>
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
export default RecipeList;
