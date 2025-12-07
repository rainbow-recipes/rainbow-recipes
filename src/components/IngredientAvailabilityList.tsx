'use client';

import React from 'react';
import Link from 'next/link';
import { Basket2 } from 'react-bootstrap-icons';

export type IngredientAvailabilityEntry = {
  id?: number | string;
  store: string;
  storeId?: string;
  availability: boolean;
  price: number;
  unit: string;
};

export type IngredientAvailability = {
  id: number | string;
  name: string;
  entries: IngredientAvailabilityEntry[];
};

type Props = {
  items: IngredientAvailability[];
};

export function IngredientAvailabilityList({ items }: Props) {
  const formatName = (name: string) => (name
    ? name
      .split(' ')
      .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
      .join(' ')
    : '');

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <h5 className="mb-0">Get the Ingredients</h5>
        <Basket2 size={22} />
      </div>
      <div className="list-group">
        {items.map((ing) => (
          <div key={ing.id} className="list-group-item">
            <div className="fw-semibold mb-1">{formatName(ing.name)}</div>
            {ing.entries.length === 0 ? (
              <div className="text-muted small">No local listings yet.</div>
            ) : (
              <ul className="mb-0 ps-0" style={{ listStyle: 'none' }}>
                {ing.entries.map((entry, idx) => (
                  <li
                    key={entry.id ?? `${ing.id}-${idx}`}
                    className="d-flex align-items-center gap-2"
                  >
                    {entry.storeId ? (
                      <Link href={`/vendors/${entry.storeId}`} className="text-decoration-none">
                        {entry.store}
                      </Link>
                    ) : (
                      <span>{entry.store}</span>
                    )}
                    {entry.availability ? (
                      <span className="badge bg-success">In Stock</span>
                    ) : (
                      <span className="badge bg-secondary">Out of Stock</span>
                    )}
                    <span className="text-muted">
                      {entry.availability ? `$${entry.price.toFixed(2)} / ${entry.unit}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default IngredientAvailabilityList;
