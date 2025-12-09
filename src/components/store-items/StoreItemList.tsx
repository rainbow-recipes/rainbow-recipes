'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Table, Badge } from 'react-bootstrap';
import type { StoreItem, DatabaseItem, ItemCategory } from '@prisma/client';
import { ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import { prettyCategory } from '@/lib/categoryUtils';
import StoreItemRow from './StoreItemRow';

type StoreItemWithCategory = StoreItem & {
  databaseItem: DatabaseItem;
  price: number;
};

interface StoreItemListProps {
  items: StoreItemWithCategory[];
  // eslint-disable-next-line react/require-default-props
  showSearch?: boolean;
  // eslint-disable-next-line react/require-default-props
  mode?: 'myStore' | 'publicVendor';
}

export default function StoreItemList({
  items,
  showSearch = true,
  mode = 'publicVendor',
}: StoreItemListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ItemCategory[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in stock' | 'out of stock'>('all');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sortOption, setSortOption] = useState<
  'price-asc' | 'price-desc' | 'alpha-asc' | 'alpha-desc' | 'none'
  >('none');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const isMyStore = mode === 'myStore';

  // Click outside to close sort dropdown
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

  // Get unique categories from items
  const availableCategories = useMemo(() => {
    const categorySet = new Set<ItemCategory>();
    items.forEach((item) => {
      categorySet.add(item.databaseItem.itemCategory);
    });
    return Array.from(categorySet).sort();
  }, [items]);

  const toggleCategory = (category: ItemCategory) => {
    setSelectedCategories((prev) => (prev.includes(category)
      ? prev.filter((c) => c !== category)
      : [...prev, category]));
  };

  const filteredAndSortedItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = [...items];

    // Apply text search
    if (term) {
      result = result.filter(
        (item) => item.databaseItem.name.toLowerCase().includes(term)
          || item.databaseItem.itemCategory.toLowerCase().includes(term)
          || (item.availability ? 'in stock' : 'out of stock').includes(term),
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      result = result.filter((item) => selectedCategories.includes(item.databaseItem.itemCategory));
    }

    // Apply availability filter
    if (availabilityFilter === 'in stock') {
      result = result.filter((item) => item.availability);
    } else if (availabilityFilter === 'out of stock') {
      result = result.filter((item) => !item.availability);
    }

    // Apply price range filter
    if (minPrice !== undefined) {
      result = result.filter((item) => item.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      result = result.filter((item) => item.price <= maxPrice);
    }

    // Apply sorting
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'alpha-asc':
        result.sort((a, b) => a.databaseItem.name.localeCompare(b.databaseItem.name));
        break;
      case 'alpha-desc':
        result.sort((a, b) => b.databaseItem.name.localeCompare(a.databaseItem.name));
        break;
      default:
        // No sorting
        break;
    }

    return result;
  }, [items, searchTerm, selectedCategories, availabilityFilter, minPrice, maxPrice, sortOption]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    const categories: ItemCategory[] = [
      'produce',
      'meat_seafood',
      'dairy_eggs',
      'frozen',
      'canned',
      'dry',
      'condiments_spices',
      'other',
    ];

    const groups: Record<string, StoreItemWithCategory[]> = {};
    filteredAndSortedItems.forEach((item) => {
      const key = item.databaseItem.itemCategory ?? 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return categories.map((cat) => ({
      category: cat,
      items: groups[cat] ?? [],
    })).filter((group) => group.items.length > 0);
  }, [filteredAndSortedItems]);

  return (
    <>
      {/* Search and controls */}
      <div className="mb-3">
        {showSearch && (
          <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
            <div className="flex-grow-1">
              <input
                type="text"
                className="form-control form-control-lg rounded-pill px-4"
                placeholder="Search items by name, category, or availability"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              Filters
              {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div ref={sortDropdownRef} className="position-relative">
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                Sort
                {isSortOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isSortOpen && (
                <div
                  className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm"
                  style={{ minWidth: '200px', zIndex: 1000 }}
                >
                  <button
                    type="button"
                    className={`dropdown-item ${sortOption === 'price-asc' ? 'active' : ''}`}
                    onClick={() => {
                      setSortOption('price-asc');
                      setIsSortOpen(false);
                    }}
                  >
                    Price: Low → High
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item ${sortOption === 'price-desc' ? 'active' : ''}`}
                    onClick={() => {
                      setSortOption('price-desc');
                      setIsSortOpen(false);
                    }}
                  >
                    Price: High → Low
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item ${sortOption === 'alpha-asc' ? 'active' : ''}`}
                    onClick={() => {
                      setSortOption('alpha-asc');
                      setIsSortOpen(false);
                    }}
                  >
                    Name: A → Z
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item ${sortOption === 'alpha-desc' ? 'active' : ''}`}
                    onClick={() => {
                      setSortOption('alpha-desc');
                      setIsSortOpen(false);
                    }}
                  >
                    Name: Z → A
                  </button>
                  <button
                    type="button"
                    className={`dropdown-item ${sortOption === 'none' ? 'active' : ''}`}
                    onClick={() => {
                      setSortOption('none');
                      setIsSortOpen(false);
                    }}
                  >
                    Default
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters panel */}
        {filtersOpen && (
          <div className="border rounded p-3 mb-3">
            <div className="row g-3">
              {/* Category filters */}
              <div className="col-12">
                <div className="fw-bold mb-2">Categories</div>
                <div className="d-flex gap-2 flex-wrap" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {availableCategories.map((cat) => (
                    <Badge
                      key={cat}
                      bg={selectedCategories.includes(cat) ? 'primary' : 'secondary'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleCategory(cat)}
                    >
                      {prettyCategory(cat)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Availability filter */}
              <div className="col-md-4">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor="availability-filter" className="form-label fw-bold">
                  Availability
                </label>
                <select
                  id="availability-filter"
                  className="form-select"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as 'all' | 'in stock' | 'out of stock')}
                >
                  <option value="all">All Items</option>
                  <option value="in stock">In Stock</option>
                  <option value="out of stock">Out of Stock</option>
                </select>
              </div>

              {/* Price range filters */}
              <div className="col-md-4">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor="min-price" className="form-label fw-bold">
                  Min Price
                </label>
                <input
                  id="min-price"
                  type="number"
                  className="form-control"
                  placeholder="$0.00"
                  min="0"
                  step="0.01"
                  value={minPrice ?? ''}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div className="col-md-4">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor="max-price" className="form-label fw-bold">
                  Max Price
                </label>
                <input
                  id="max-price"
                  type="number"
                  className="form-control"
                  placeholder="$999.99"
                  min="0"
                  step="0.01"
                  value={maxPrice ?? ''}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              {/* Clear filters button */}
              <div className="col-12">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategories([]);
                    setAvailabilityFilter('all');
                    setMinPrice(undefined);
                    setMaxPrice(undefined);
                    setSortOption('none');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items table */}
      {filteredAndSortedItems.length === 0 ? (
        <p className="text-muted">No items found.</p>
      ) : (
        <Table hover>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Size</th>
              <th>Availability</th>
              {isMyStore && <th>Actions</th>}
            </tr>
          </thead>
          {groupedItems.map((group) => (
            <tbody key={group.category}>
              <tr className="table-active">
                <td colSpan={isMyStore ? 5 : 4}>
                  <strong>{prettyCategory(group.category)}</strong>
                </td>
              </tr>
              {group.items.map((item) => (
                <StoreItemRow key={item.id} {...item} isMyStore={isMyStore} />
              ))}
            </tbody>
          ))}
        </Table>
      )}
    </>
  );
}
