'use client';

import { useMemo, useState } from 'react';
import { Table } from 'react-bootstrap';
import type { Item } from '@prisma/client';
import Link from 'next/link';
import MyStoreItem from './MyStoreItem';

type ItemClient = Omit<Item, 'price'> & { price: number };

export default function MyStoreItemsPanel({ items }: { items: ItemClient[] }) {
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
            placeholder="Search items by name, unit, or price"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Link href="/add-item" className="btn btn-outline-dark btn-lg rounded-pill">
            Add Item
          </Link>
        </div>
      </div>

      <Table hover>
        <thead>
          <tr>
            <th>Item</th>
            <th>Price $</th>
            <th>Unit</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <MyStoreItem key={item.id} {...(item as any)} />
          ))}
        </tbody>
      </Table>
    </>
  );
}
