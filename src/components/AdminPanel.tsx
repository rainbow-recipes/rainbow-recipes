/* eslint-disable no-nested-ternary */

'use client';

import { createStore } from '@/lib/dbActions';
import { useMemo, useState } from 'react';

type Role = 'USER' | 'ADMIN';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isMerchant: boolean;
  merchantApproved: boolean;
}

interface AdminPanelProps {
  initialUsers: AdminUser[];
}

const AdminPanel = ({ initialUsers }: AdminPanelProps) => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) => {
      const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      return (
        u.email.toLowerCase().includes(term)
        || fullName.includes(term)
        || (u.isMerchant ? 'merchant' : '').includes(term)
        || u.role.toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  const handleApproveMerchant = async (userId: string, userEmail: string) => {
    // optimistic update
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, merchantApproved: true } : u)));

    try {
      const res = await fetch('/api/admin/approve-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        console.error('Failed to approve merchant');
      }
    } catch (err) {
      console.error(err);
    }
    await createStore({ id: userId, owner: userEmail });
  };

  const handleDeleteUser = async (userId: string) => {
    // 🛑 confirmation popup
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      'Are you sure you want to delete this user? This action cannot be undone.',
    );
    if (!confirmed) return;

    // optimistic removal
    const prevUsers = users;
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        console.error('Failed to delete user');
        setUsers(prevUsers); // revert
      }
    } catch (err) {
      console.error(err);
      setUsers(prevUsers); // revert
    }
  };

  return (
    <>
      {/* Search bar */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="flex-grow-1">
          <input
            type="text"
            className="form-control form-control-lg rounded-pill px-4"
            placeholder="Search users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users table */}
      {filteredUsers.length === 0 ? (
        <p className="text-muted">No users found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Vendor</th>
                <th>Approved</th>
                <th style={{ width: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    {u.firstName || u.lastName
                      ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                      : '—'}
                  </td>
                  <td>{u.role}</td>
                  <td>{u.isMerchant ? 'Yes' : 'No'}</td>
                  <td>
                    {u.isMerchant
                      ? u.merchantApproved
                        ? 'Yes'
                        : 'Pending'
                      : '—'}
                  </td>
                  <td>
                    {u.isMerchant && !u.merchantApproved && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => handleApproveMerchant(u.id, u.email)}
                      >
                        Approve vendor
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete user
                    </button>
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

export default AdminPanel;
