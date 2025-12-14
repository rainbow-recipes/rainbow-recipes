/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useSession, signOut } from 'next-auth/react';
import swal from 'sweetalert';
import { updateProfile, changeEmail, changePasswordVerified, deleteAccount } from '@/lib/dbActions';

type Role = 'USER' | 'ADMIN';

interface ProfileUser {
  id: string;
  email: string;
  name?: string | null;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  role: Role;
  isMerchant: boolean;
  merchantApproved: boolean;
}

interface RecipeSummary {
  id: number;
  name: string;
  prepTime: number;
  cost: number;
}

interface StoreSummary {
  id: string;
  name: string;
  location: string;
  website: string | null; // <-- matches Prisma (string | null)
  hours: string[];
  image: string | null;
}

interface ProfileClientProps {
  user: ProfileUser;
  publishedRecipes: RecipeSummary[];
  favoriteRecipes: RecipeSummary[];
  // eslint-disable-next-line react/require-default-props
  store?: StoreSummary | null;
  // eslint-disable-next-line react/require-default-props
  canEdit?: boolean;
}

export default function ProfileClient({
  user: initialUser,
  publishedRecipes,
  favoriteRecipes,
  store,
  canEdit = true,
}: ProfileClientProps) {
  const { data: session } = useSession();
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [editTab, setEditTab] = useState<'profile' | 'email' | 'password' | 'delete'>('profile');
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(initialUser.firstName ?? '');
  const [lastName, setLastName] = useState(initialUser.lastName ?? '');
  const [image, setImage] = useState(initialUser.image ?? '');
  const [error, setError] = useState<string | null>(null);

  // Change email state
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fullName = user.firstName || user.lastName
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : user.name || user.email.split('@')[0];

  const initials = (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() || '';
      setImage(result); // base64 data URL; safe for <img>
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const data = await updateProfile(session?.user?.email || '', {
        firstName,
        lastName,
        image,
      });

      if (data.user) {
        setUser((prev) => ({
          ...prev,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          image: data.user.image,
        }));
      }

      setEditing(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    try {
      await changeEmail(session?.user?.email || '', newEmail);

      setUser((prev) => ({ ...prev, email: newEmail }));
      setEditTab('profile');
      setEditing(false);
      setNewEmail('');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      swal('Success', 'Your email has been changed. You will be signed out.', 'success', { timer: 2000 }).then(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        signOut({ redirect: true, callbackUrl: '/signin' });
      });
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await changePasswordVerified(
        user.email,
        currentPassword,
        newPassword,
      );

      setEditTab('profile');
      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      swal('Success', 'Your password has been changed. You will be signed out.', 'success', {
        timer: 2000,
      }).then(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        signOut({ redirect: true, callbackUrl: '/signin' });
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    // Confirm deletion with sweetalert
    const ok = await new Promise<boolean>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      swal({
        title: 'Delete Account',
        text: 'Are you sure you want to delete your account?'
          + ' This action cannot be undone.'
          + ' All your data will be permanently removed.',
        icon: 'warning',
        buttons: ['Cancel', 'Delete'],
        dangerMode: true,
      }).then((v) => resolve(Boolean(v)));
    });

    if (!ok) return;

    try {
      await deleteAccount(user.email, deletePassword);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      swal('Success', 'Your account has been deleted. You will be logged out.', 'success');
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div
      className="container my-5"
      style={{ minHeight: 'calc(100vh - 120px)' }}
    >
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12 col-lg-4 d-flex align-items-center mb-3 mb-lg-0">
          <div className="d-flex align-items-center gap-3">
            {/* Avatar */}
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={fullName}
                width={96}
                height={96}
                className="rounded-circle border"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-circle d-flex align-items-center justify-content-center border"
                style={{
                  width: 96,
                  height: 96,
                  backgroundColor: '#e5f5f0',
                  color: '#006b5a',
                  fontWeight: 600,
                  fontSize: '1.5rem',
                }}
              >
                {initials || '🙂'}
              </div>
            )}

            {/* Basic info */}
            <div>
              <h1 className="h4 mb-1">{fullName}</h1>
              <p className="mb-1 text-muted">{user.email}</p>

              <div className="mb-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  {user.role === 'ADMIN' ? 'Admin' : 'User'}
                </span>
                {user.isMerchant && (
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle ms-2">
                    Vendor
                    {user.merchantApproved ? '' : ' (Pending)'}
                  </span>
                )}
              </div>

              {canEdit && (
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-dark bg-white btn-profile-edit"
                    onClick={() => {
                      setEditing((prev) => !prev);
                      if (editing) {
                        setEditTab('profile');
                      }
                    }}
                  >
                    {editing ? 'Cancel' : 'Edit profile'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="col-12 col-lg-8">
          <div className="row g-3">
            <div className="col-6 col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="text-muted mb-1 small">Published recipes</div>
                  <div className="fs-4 fw-semibold">
                    {publishedRecipes.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <div className="text-muted mb-1 small">Favorite recipes</div>
                  <div className="fs-4 fw-semibold">
                    {favoriteRecipes.length}
                  </div>
                </div>
              </div>
            </div>

            {/* room for another stat if needed */}
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      {editing && canEdit && (
        <div className="row mb-4">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h2 className="h5 mb-3">Edit profile</h2>

                {/* Tabs */}
                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${editTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setEditTab('profile')}
                    >
                      Profile
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${editTab === 'email' ? 'active' : ''}`}
                      onClick={() => setEditTab('email')}
                    >
                      Change email
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${editTab === 'password' ? 'active' : ''}`}
                      onClick={() => setEditTab('password')}
                    >
                      Change password
                    </button>
                  </li>
                  {user.role !== 'ADMIN' && (
                    <li className="nav-item">
                      <button
                        type="button"
                        className={`nav-link text-danger ${editTab === 'delete' ? 'active' : ''}`}
                        onClick={() => setEditTab('delete')}
                      >
                        Delete account
                      </button>
                    </li>
                  )}
                </ul>

                {/* Profile Tab */}
                {editTab === 'profile' && (
                  <>
                    {error && (
                      <div className="alert alert-danger py-2">{error}</div>
                    )}

                    <form onSubmit={handleSave} className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">First name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">Last name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">Upload profile photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control"
                          onChange={handleFileChange}
                        />
                        <div className="form-text">
                          Choose an image from your device.
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label">Or photo URL (optional)</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://example.com/my-photo.jpg"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                        />
                        <div className="form-text">
                          You can paste an image link instead of uploading.
                        </div>
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditing(false);
                            setFirstName(initialUser.firstName ?? '');
                            setLastName(initialUser.lastName ?? '');
                            setImage(initialUser.image ?? '');
                            setError(null);
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-success"
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save changes'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* Email Tab */}
                {editTab === 'email' && (
                  <>
                    {emailError && (
                      <div className="alert alert-danger py-2">{emailError}</div>
                    )}

                    <form onSubmit={handleChangeEmail} className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Current email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={user.email}
                          disabled
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">New email</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Enter new email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditing(false);
                            setNewEmail('');
                            setEmailError(null);
                            setEditTab('profile');
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-success"
                          disabled={saving}
                        >
                          {saving ? 'Changing...' : 'Change email'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* Password Tab */}
                {editTab === 'password' && (
                  <>
                    {passwordError && (
                      <div className="alert alert-danger py-2">{passwordError}</div>
                    )}

                    <form onSubmit={handleChangePassword} className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Current password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">New password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <div className="form-text">
                          At least 8 characters
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Confirm password</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditing(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setPasswordError(null);
                            setEditTab('profile');
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-success"
                          disabled={saving}
                        >
                          {saving ? 'Changing...' : 'Change password'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* Delete Account Tab */}
                {editTab === 'delete' && (
                  <>
                    <div className="alert alert-danger py-3 mb-3">
                      <h6 className="alert-heading">Danger Zone</h6>
                      <p className="mb-0">
                        Deleting your account is permanent. You will lose all recipes,
                        {' '}
                        favorites, reviews, and profile data. This cannot be undone.
                      </p>
                    </div>

                    {deleteError && (
                      <div className="alert alert-danger py-2">{deleteError}</div>
                    )}

                    <form onSubmit={handleDeleteAccount} className="row g-3">
                      <div className="col-12">
                        <label className="form-label">
                          Enter your password to delete account
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Enter your password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          required
                        />
                        <div className="form-text">
                          We need your password to confirm this action.
                        </div>
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setEditing(false);
                            setDeletePassword('');
                            setDeleteError(null);
                            setEditTab('profile');
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-danger"
                          disabled={saving}
                        >
                          {saving ? 'Deleting...' : 'Delete account'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merchant store section */}
      {user.isMerchant && store && (
        <div className="row mb-4">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h2 className="h5 mb-1">Your store</h2>
                    <p className="mb-1 fw-semibold">{store.name}</p>
                    <p className="mb-1 text-muted small">
                      Location:
                      {' '}
                      {store.location}
                    </p>
                    {store.website && (
                      <p className="mb-1 small">
                        Website:
                        {' '}
                        <a
                          href={store.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {store.website}
                        </a>
                      </p>
                    )}
                  </div>
                  <a
                    href="/my-store"
                    className="btn btn-sm btn-outline-success"
                  >
                    Manage store
                  </a>
                </div>

                {store.hours && store.hours.length > 0 && (
                  <div className="mt-2">
                    <div className="text-muted small mb-1">Hours</div>
                    <ul className="list-unstyled mb-0 small">
                      {store.hours.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lists of recipes */}
      <div className="row g-4">
        {/* Published recipes */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0">
              <h2 className="h5 mb-0">Your published recipes</h2>
            </div>
            <div className="card-body">
              {publishedRecipes.length === 0 ? (
                <p className="text-muted mb-0">
                  You haven&apos;t published any recipes yet.
                </p>
              ) : (
                <ul className="list-group list-group-flush">
                  {publishedRecipes.map((recipe) => (
                    <li
                      key={recipe.id}
                      className="list-group-item px-0 d-flex justify-content-between align-items-start"
                    >
                      <div>
                        <div className="fw-semibold">{recipe.name}</div>
                        <div className="text-muted small">
                          Prep time:
                          {' '}
                          {recipe.prepTime}
                          {' '}
                          min · Cost: $
                          {recipe.cost.toFixed(2)}
                        </div>
                      </div>
                      <a
                        href={`/recipes/${recipe.id}`}
                        className="btn btn-sm btn-outline-success"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Favorite recipes */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-0">
              <h2 className="h5 mb-0">Your favorite recipes</h2>
            </div>
            <div className="card-body">
              {favoriteRecipes.length === 0 ? (
                <p className="text-muted mb-0">
                  You haven&apos;t favorited any recipes yet.
                </p>
              ) : (
                <ul className="list-group list-group-flush">
                  {favoriteRecipes.map((recipe) => (
                    <li
                      key={recipe.id}
                      className="list-group-item px-0 d-flex justify-content-between align-items-start"
                    >
                      <div>
                        <div className="fw-semibold">{recipe.name}</div>
                        <div className="text-muted small">
                          Prep time:
                          {' '}
                          {recipe.prepTime}
                          {' '}
                          min · Cost: $
                          {recipe.cost.toFixed(2)}
                        </div>
                      </div>
                      <a
                        href={`/recipes/${recipe.id}`}
                        className="btn btn-sm btn-outline-success"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
