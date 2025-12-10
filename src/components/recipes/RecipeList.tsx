/* eslint-disable max-len */

'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { Recipe, Tag, ItemCategory } from '@prisma/client';
import { Card } from 'react-bootstrap';
import { SuitHeart, SuitHeartFill, ChevronDown, ChevronRight } from 'react-bootstrap-icons';
import defaultRecipeImage from '../../../public/default-recipe-image.png';

type RecipeWithTags = Recipe & {
  tags: Tag[];
  ingredients: { id: number; name: string; itemCategory: ItemCategory }[];
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
  } | null;
};

interface RecipeListProps {
  initialRecipes: RecipeWithTags[];
  allTags: Tag[];
  allIngredients: { id: number; name: string; itemCategory: ItemCategory }[];
  initialFavoriteIds: number[];
  isAdmin: boolean;
  // the currently signed-in user's id (optional) - may be string or number depending on auth
  // eslint-disable-next-line react/require-default-props
  currentUserId?: string | number;
  // eslint-disable-next-line react/require-default-props
  showSearch?: boolean;
  // eslint-disable-next-line react/require-default-props
  mode?: 'default' | 'publicProfile';
}

export default function RecipeList({
  initialRecipes,
  allTags,
  allIngredients,
  initialFavoriteIds,
  isAdmin,
  currentUserId,
  showSearch = true,
  mode = 'default',
}: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeWithTags[]>(initialRecipes);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlFoodType = mode === 'publicProfile' ? null : searchParams.get('foodType');
  const urlAppliance = mode === 'publicProfile' ? null : searchParams.get('appliance');

  const dietTags = useMemo(() => allTags.filter((t) => t.category === 'Diet'), [allTags]);
  const applianceTags = useMemo(() => allTags.filter((t) => t.category === 'Appliance'), [allTags]);

  // Group ingredients by category
  const groupedIngredients = useMemo(() => {
    const groups: Record<ItemCategory, typeof allIngredients> = {} as any;
    allIngredients.forEach((ing) => {
      if (!groups[ing.itemCategory]) {
        groups[ing.itemCategory] = [];
      }
      groups[ing.itemCategory].push(ing);
    });
    // Sort ingredients within each category
    Object.keys(groups).forEach((cat) => {
      groups[cat as ItemCategory].sort((a, b) => a.name.localeCompare(b.name));
    });
    return groups;
  }, [allIngredients]);

  // Helper function to find tag IDs by name
  const getTagIdsByName = (tagName: string, tagList: Tag[]) => {
    const normalizeString = (str: string) => str.toLowerCase().replace('-', '').replace(' ', '');
    const matchedTags = tagList.filter((tag) => normalizeString(tag.name) === normalizeString(tagName));
    return matchedTags.map((tag) => tag.id);
  };

  // Initialize state without dependencies on initial props
  const [selectedDietTags, setSelectedDietTags] = useState<number[]>([]);
  const [selectedApplianceTags, setSelectedApplianceTags] = useState<number[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [selectedIngredientCategories, setSelectedIngredientCategories] = useState<ItemCategory[]>([]);
  const [openIngredientCategories, setOpenIngredientCategories] = useState<Record<ItemCategory, boolean>>({} as Record<ItemCategory, boolean>);
  const [maxPrepTime, setMaxPrepTime] = useState<number | undefined>();
  const [maxCost, setMaxCost] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<number[]>(initialFavoriteIds);

  // State for collapsible sections
  const [foodTypeOpen, setFoodTypeOpen] = useState(false);
  const [applianceOpen, setApplianceOpen] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
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

      // OR-based ingredient filtering: match if ANY selected ingredient OR ANY ingredient in selected categories
      if (selectedIngredientCategories.length > 0 || selectedIngredientIds.length > 0) {
        const matchesCategory = selectedIngredientCategories.length > 0
          && recipe.ingredients.some((ing) => selectedIngredientCategories.includes(ing.itemCategory));
        const matchesIngredient = selectedIngredientIds.length > 0
          && recipe.ingredients.some((ing) => selectedIngredientIds.includes(ing.id));
        if (!matchesCategory && !matchesIngredient) return false;
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
    selectedIngredientCategories,
    selectedIngredientIds,
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

  const toggleIngredient = (id: number) => {
    setSelectedIngredientIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleIngredientCategory = (category: ItemCategory) => {
    setSelectedIngredientCategories((prev) => (prev.includes(category) ? prev.filter((x) => x !== category) : [...prev, category]));
  };

  const toggleOpenIngredientCategory = (category: ItemCategory) => {
    setOpenIngredientCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
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
      {showSearch && mode !== 'publicProfile' && (
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

                {/* Add Recipe button - only on /recipes page and for logged-in users or admin */}
                {pathname === '/recipes' && (currentUserId || isAdmin) && (
                  <Link href="/recipes/add" className="btn btn-outline-dark btn-lg rounded-pill">
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
        {mode !== 'publicProfile' && (
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

                {/* Ingredients - Grouped by Category */}
                <details open={ingredientsOpen} className="mb-2">
                  <summary
                    className="fw-semibold mb-1"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault();
                      setIngredientsOpen(!ingredientsOpen);
                    }}
                  >
                    Ingredients
                  </summary>
                  {Object.keys(groupedIngredients).length === 0 && (
                    <div className="text-muted small">(no ingredients yet)</div>
                  )}
                  {Object.entries(groupedIngredients).map(([category, ingredients]) => {
                    const cat = category as ItemCategory;
                    const isOpen = openIngredientCategories[cat] || false;
                    const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
                    return (
                      <div key={category} className="mb-2">
                        <div className="d-flex align-items-center">
                          <button
                            type="button"
                            className="btn btn-link p-0 border-0 text-decoration-none me-1"
                            onClick={() => toggleOpenIngredientCategory(cat)}
                            style={{ fontSize: '0.9rem' }}
                          >
                            {isOpen ? <ChevronDown /> : <ChevronRight />}
                          </button>
                          <div className="form-check">
                            <input
                              id={`cat-${category}`}
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIngredientCategories.includes(cat)}
                              onChange={() => toggleIngredientCategory(cat)}
                            />
                            <label htmlFor={`cat-${category}`} className="form-check-label fw-normal">
                              {categoryLabel}
                            </label>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="ms-4" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {ingredients.map((ingredient) => (
                              <div key={ingredient.id} className="form-check">
                                <input
                                  id={`ing-${ingredient.id}`}
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedIngredientIds.includes(ingredient.id)}
                                  onChange={() => toggleIngredient(ingredient.id)}
                                />
                                <label htmlFor={`ing-${ingredient.id}`} className="form-check-label">
                                  {ingredient.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
        )}

        {/* Cards column */}
        <div className={mode === 'publicProfile' ? 'col-12' : 'col-md-9'}>
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
                    <Link href={`/recipes/${recipe.id}`} className="text-decoration-none" aria-label={`View ${recipe.name}`}>
                      <Card className="h-100 border-0 shadow-sm position-relative">
                        {recipe.image ? (
                          <Card.Img
                            src={recipe.image}
                            variant="top"
                            alt={recipe.name}
                            style={{ objectFit: 'cover', height: '180px', width: '100%' }}
                          />
                        ) : (
                          <Card.Img
                            src={defaultRecipeImage.src}
                            variant="top"
                            alt={recipe.name}
                            style={{ objectFit: 'cover', height: '180px', width: '100%' }}
                          />
                        )}

                        <Card.Body className="d-flex flex-column">
                          {/* Title + heart row */}
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="card-title mb-0">{recipe.name}</h5>
                            {mode !== 'publicProfile' && (
                              <button
                                type="button"
                                className="btn btn-link p-0 border-0"
                                style={{ position: 'relative', zIndex: 2 }}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <span style={{ fontSize: '1.4rem' }}>
                                  {isFavorite ? <SuitHeartFill /> : <SuitHeart />}
                                </span>
                              </button>
                            )}
                          </div>

                          {recipe.author && (
                            <Card.Text className="text-muted small mb-2">
                              <Link
                                href={`/profiles/${recipe.author.id}`}
                                className="text-decoration-none"
                                onClick={(e) => e.stopPropagation()}
                                style={{ position: 'relative', zIndex: 2 }}
                              >
                                {recipe.author.firstName && recipe.author.lastName
                                  ? `${recipe.author.firstName} ${recipe.author.lastName}`
                                  : recipe.author.firstName || recipe.author.name || 'Anonymous User'}
                              </Link>
                            </Card.Text>
                          )}

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

                          <div className="mt-auto">
                            <div>
                              {recipe.tags.map((tag) => (
                                <span key={tag.id} className="badge bg-light text-dark border me-1">{tag.name}</span>
                              ))}
                            </div>
                          </div>

                          {mode !== 'publicProfile' && (
                            <div className="mt-3 d-flex justify-content-end">
                              {(isAdmin || isOwner) && (
                                <Link
                                  href={`/recipes/edit/${recipe.id}`}
                                  className="btn btn-sm btn-outline-primary ms-2"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ position: 'relative', zIndex: 2 }}
                                >
                                  Edit
                                </Link>
                              )}

                              {(isAdmin || isOwner) && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger ms-2"
                                  style={{ position: 'relative', zIndex: 2 }}
                                  onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe.id); }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Link>
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
