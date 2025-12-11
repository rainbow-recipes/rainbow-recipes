'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ItemCategory } from '@prisma/client';
import { prettyCategory } from '@/lib/categoryUtils';
import { approveDatabaseItem, deleteDatabaseItem, mergeDatabaseItems, updateDatabaseItem } from '@/lib/dbActions';
import { DatabaseFillGear, Intersect } from 'react-bootstrap-icons';

interface DatabaseItem {
  id: number;
  name: string;
  itemCategory: ItemCategory;
  approved: boolean;
}

interface AdminDatabaseItemPanelProps {
  initialItems: DatabaseItem[];
  // eslint-disable-next-line react/require-default-props
  onRefresh?: () => Promise<void>;
}

const AdminDatabaseItemPanel = ({ initialItems, onRefresh }: AdminDatabaseItemPanelProps) => {
  const [items, setItems] = useState<DatabaseItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'category'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'unapproved'>('all');
  const [filterCategory, setFilterCategory] = useState<ItemCategory | 'all'>('all');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('other');
  const [mergeSourceId, setMergeSourceId] = useState<number | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);

  useEffect(() => {
    if (items.length >= 2) {
      const first = items[0];
      const next = items.find((it) => it.id !== first.id) ?? null;
      setMergeSourceId(first.id);
      setMergeTargetId(next?.id ?? null);
    } else {
      setMergeSourceId(null);
      setMergeTargetId(null);
    }
  }, [items]);

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

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = items;

    // Apply text search filter
    if (term) {
      result = result.filter(
        (item) => item.name.toLowerCase().includes(term)
          || item.itemCategory.toLowerCase().includes(term),
      );
    }

    // Apply approved filter
    if (filterApproved === 'approved') {
      result = result.filter((item) => item.approved);
    } else if (filterApproved === 'unapproved') {
      result = result.filter((item) => !item.approved);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter((item) => item.itemCategory === filterCategory);
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'id') {
        comparison = a.id - b.id;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        // sortBy === 'category'
        comparison = a.itemCategory.localeCompare(b.itemCategory);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, searchTerm, sortBy, sortOrder, filterApproved, filterCategory]);

  const handleApprove = async (id: number) => {
    const previous = items;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, approved: true } : it)));
    try {
      await approveDatabaseItem(id);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setItems(previous);
    }
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to delete this database item?');
    if (!confirmed) return;

    const previous = items;
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      await deleteDatabaseItem(id);
    } catch (err) {
      setItems(previous);
    }
  };

  const handleStartEdit = (item: DatabaseItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCategory(item.itemCategory);
  };

  const handleSaveEdit = async (id: number) => {
    const previous = items;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name: editName, itemCategory: editCategory } : it)));
    setEditId(null);
    try {
      await updateDatabaseItem({ itemId: id, name: editName, itemCategory: editCategory });
    } catch (err) {
      setItems(previous);
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleConfirmMerge = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeTargetId === mergeSourceId) return;

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      'Merge this item into the selected target? This moves all references and deletes the source item.',
    );
    if (!confirmed) return;

    const previous = items;
    // Optimistically remove the source item
    setItems((prev) => prev.filter((it) => it.id !== mergeSourceId));
    setMergeSourceId(null);
    setMergeTargetId(null);

    try {
      await mergeDatabaseItems(mergeSourceId!, mergeTargetId!);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setItems(previous);
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Failed to merge');
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">Database Item Management</h4>
        <Link href="/admin/add-database-item">
          <button type="button" className="btn btn-outline-dark btn-md rounded-pill">
            Add Database Item
          </button>
        </Link>
      </div>

      <hr className="my-4" />

      {/* Merge controls */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <Intersect size={24} />
        <h5 className="mb-0">Merge Items</h5>
      </div>
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap flex-md-nowrap" style={{ overflowX: 'auto' }}>
        <select
          className="form-select form-select-sm"
          style={{ minWidth: '150px' }}
          value={mergeSourceId ?? ''}
          onChange={(e) => setMergeSourceId(Number(e.target.value))}
          disabled={items.length < 2}
        >
          <option value="" disabled>Select source</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
              {' '}
              (ID
              {' '}
              {it.id}
              )
            </option>
          ))}
        </select>
        <span className="mx-1">→</span>
        <select
          className="form-select form-select-sm"
          style={{ minWidth: '150px' }}
          value={mergeTargetId ?? ''}
          onChange={(e) => setMergeTargetId(Number(e.target.value))}
          disabled={items.length < 2}
        >
          <option value="" disabled>Select target</option>
          {items
            .filter((it) => it.id !== mergeSourceId)
            .map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
                {' '}
                (ID
                {' '}
                {it.id}
                )
              </option>
            ))}
        </select>
        <button
          type="button"
          className="btn btn-sm btn-outline-warning"
          onClick={handleConfirmMerge}
          disabled={!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId}
        >
          Merge
        </button>
      </div>

      <hr className="my-4" />

      {/* Search bar and filters */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <DatabaseFillGear size={24} />
        <h5 className="mb-0">Database Items</h5>
      </div>
      <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <div className="flex-grow-1">
          <input
            type="text"
            className="form-control form-control-lg rounded-pill px-4"
            placeholder="Search database items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="form-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as 'id' | 'name' | 'category');
              setSortOrder(order as 'asc' | 'desc');
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="id-asc">ID (Low to High)</option>
            <option value="id-desc">ID (High to Low)</option>
            <option value="category-asc">Category (A-Z)</option>
            <option value="category-desc">Category (Z-A)</option>
          </select>
        </div>
        <div>
          <select
            className="form-select"
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value as 'all' | 'approved' | 'unapproved')}
          >
            <option value="all">All Items</option>
            <option value="approved">Approved</option>
            <option value="unapproved">Not Approved</option>
          </select>
        </div>
        <div>
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ItemCategory | 'all')}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {prettyCategory(cat)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items table */}
      {filteredItems.length === 0 ? (
        <p className="text-muted">No database items found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Item Category</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {editId === item.id ? (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td>
                    {editId === item.id ? (
                      <select
                        className="form-select form-select-sm"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as ItemCategory)}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {prettyCategory(cat)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      prettyCategory(item.itemCategory)
                    )}
                  </td>
                  <td>{item.approved ? 'Yes' : 'No'}</td>
                  <td className="align-middle" style={{ verticalAlign: 'middle' }}>
                    {editId === item.id ? (
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleSaveEdit(item.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        {!item.approved && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleApprove(item.id)}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleStartEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AdminDatabaseItemPanel;
