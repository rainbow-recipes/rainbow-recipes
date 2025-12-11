'use client';

import { useMemo, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { addTag, editTag, deleteTag } from '@/lib/dbActions';

interface Tag {
  id: number;
  name: string;
  category: string;
  recipeCount: number;
}

interface AdminTagPanelProps {
  initialTags: Tag[];
  // eslint-disable-next-line react/require-default-props
  onRefresh?: () => Promise<void>;
}

const AdminTagPanel = ({ initialTags, onRefresh }: AdminTagPanelProps) => {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Diet' | 'Appliance'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'category' | 'recipes'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'Diet' | 'Appliance'>('Diet');
  // Add new tag modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<'Diet' | 'Appliance'>('Diet');

  const filteredTags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let result = tags;

    // Apply text search filter
    if (term) {
      result = result.filter(
        (tag) => tag.name.toLowerCase().includes(term)
          || tag.category.toLowerCase().includes(term),
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter((tag) => tag.category === filterCategory);
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'id') {
        comparison = a.id - b.id;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else {
        // sortBy === 'recipes'
        comparison = a.recipeCount - b.recipeCount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tags, searchTerm, sortBy, sortOrder, filterCategory]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      // eslint-disable-next-line no-alert
      alert('Tag name is required');
      return;
    }

    try {
      const newTag = await addTag({ name: newTagName.trim(), category: newTagCategory });
      setTags((prev) => [...prev, { ...newTag, recipeCount: 0 }]);
      setShowAddModal(false);
      setNewTagName('');
      setNewTagCategory('Diet');

      if (onRefresh) await onRefresh();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Failed to add tag');
    }
  };

  const handleStartEdit = (tag: Tag) => {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditCategory(tag.category as 'Diet' | 'Appliance');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      // eslint-disable-next-line no-alert
      alert('Tag name is required');
      return;
    }

    const previous = tags;
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name: editName, category: editCategory } : t)));
    setEditId(null);

    try {
      await editTag({ id, name: editName.trim(), category: editCategory });
      if (onRefresh) await onRefresh();
    } catch (err) {
      setTags(previous);
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Failed to update tag');
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to delete this tag? This will remove it from all recipes.');
    if (!confirmed) return;

    const previous = tags;
    setTags((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTag(id);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setTags(previous);
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">Tag Management</h4>
        <button
          type="button"
          className="btn btn-outline-dark btn-md rounded-pill"
          onClick={() => setShowAddModal(true)}
        >
          Add Tag
        </button>
      </div>

      {/* Search bar and filters */}
      <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <div className="flex-grow-1">
          <input
            type="text"
            className="form-control form-control-lg rounded-pill px-4"
            placeholder="Search tags"
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
              setSortBy(by as 'id' | 'name' | 'category' | 'recipes');
              setSortOrder(order as 'asc' | 'desc');
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="id-asc">ID (Low to High)</option>
            <option value="id-desc">ID (High to Low)</option>
            <option value="category-asc">Category (A-Z)</option>
            <option value="category-desc">Category (Z-A)</option>
            <option value="recipes-asc">Recipes (Low to High)</option>
            <option value="recipes-desc">Recipes (High to Low)</option>
          </select>
        </div>
        <div>
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as 'all' | 'Diet' | 'Appliance')}
          >
            <option value="all">All Categories</option>
            <option value="Diet">Diet</option>
            <option value="Appliance">Appliance</option>
          </select>
        </div>
      </div>

      {/* Tags table */}
      {filteredTags.length === 0 ? (
        <p className="text-muted">No tags found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Used in Recipes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.id}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {editId === tag.id ? (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      tag.name
                    )}
                  </td>
                  <td>
                    {editId === tag.id ? (
                      <select
                        className="form-select form-select-sm"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as 'Diet' | 'Appliance')}
                      >
                        <option value="Diet">Diet</option>
                        <option value="Appliance">Appliance</option>
                      </select>
                    ) : (
                      tag.category
                    )}
                  </td>
                  <td>{tag.recipeCount}</td>
                  <td>
                    {editId === tag.id ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleSaveEdit(tag.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleStartEdit(tag)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(tag.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Tag Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tag</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tag Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={newTagCategory}
                onChange={(e) => setNewTagCategory(e.target.value as 'Diet' | 'Appliance')}
              >
                <option value="Diet">Diet</option>
                <option value="Appliance">Appliance</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddTag}>
            Add Tag
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminTagPanel;
