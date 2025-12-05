'use client';

import { useMemo, useState } from 'react';
import { Table } from 'react-bootstrap';
import type { Item } from '@prisma/client';
import Link from 'next/link';
import StoreItem from './StoreItem';

type ItemClient = Omit<Item, 'price'> & { price: number };

export default function StoreItemsPanel({ items, isMyStore }: { items: ItemClient[], isMyStore: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;

    return items.filter((it) => it.name.toLowerCase().includes(term)
      || it.unit.toLowerCase().includes(term)
      || String(it.price).toLowerCase().includes(term));
  }, [items, searchTerm]);

  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="flex-grow-1">
          <input
            type="text"
            className="form-control form-control-lg rounded-pill px-4"
            placeholder="Search items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {(isMyStore) && (
          <div>
            <Link href="/add-item" className="btn btn-outline-dark btn-lg rounded-pill">
              Add Item
            </Link>
          </div>
        )}
      </div>

      <Table hover>
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th>Size</th>
            <th>Availability</th>
            {(isMyStore) && (<th>Actions</th>)}
          </tr>
        </thead>
        {/** Group items by ItemCategory and render a category header row followed by its items */}
        {(() => {
          const categories = [
            'produce',
            'meat_seafood',
            'dairy_eggs',
            'frozen',
            'canned',
            'dry',
            'condiments_spices',
            'other',
          ];

          const prettyCategory = (c?: string) => {
            switch (c) {
              case 'produce':
                return 'Produce';
              case 'meat_seafood':
                return 'Meat / Seafood';
              case 'dairy_eggs':
                return 'Dairy & Eggs';
              case 'frozen':
                return 'Frozen';
              case 'canned':
                return 'Canned Goods';
              case 'dry':
                return 'Dry Goods';
              case 'condiments_spices':
                return 'Condiments & Spices';
              default:
                return 'Other';
            }
          };

          // build group map
          const groups: Record<string, ItemClient[]> = {};
          for (const it of filtered) {
            const key = (it as any).itemCategory ?? 'other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(it);
          }

          // render in category order
          return categories.map((cat) => {
            const group = groups[cat] ?? [];
            if (!group.length) return null;
            return (
              <tbody key={cat}>
                <tr className="table-active">
                  <td colSpan={5}><strong>{prettyCategory(cat)}</strong></td>
                </tr>
                {group.map((item) => (
                  <StoreItem key={item.id} {...(item as any)} isMyStore={isMyStore} />
                ))}
              </tbody>
            );
          });
        })()}
      </Table>
    </>
  );
}
