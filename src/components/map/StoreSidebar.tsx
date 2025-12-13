'use client';

import Link from 'next/link';
import styles from './StoreMap.module.css';

type LocatedStore = {
  id: string;
  name: string;
  website: string | null;
  location: string;
  hours: string[];
  image: string | null;
  owner: string;
  lat: number;
  lng: number;
  displayName?: string;
  provider?: string;
  usedQuery?: string;
};

interface StoreSidebarProps {
  storeCount: number;
  filtered: LocatedStore[];
  loading: boolean;
  error: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  hoursPreview: (hours: string[]) => string;
}

export function StoreSidebar({
  storeCount,
  filtered,
  loading,
  error,
  query,
  onQueryChange,
  hoursPreview,
}: StoreSidebarProps) {
  const queryIsActive = query.trim().length > 0;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Stores Map</h2>
        <span className={styles.badge}>
          public
        </span>
      </div>

      <p className={styles.description}>
        Browse vendors and see where they are located.
      </p>

      <input
        className={styles.search}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by name or address..."
      />

      {loading && (
        <div className={styles.loadingText}>
          Loading stores & geocoding addresses...
        </div>
      )}

      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      {/* Debug counts */}
      {!loading && !error && (
        <div className={styles.debugCounts}>
          Stores loaded:
          {' '}
          {storeCount}
          {' '}
          • Map points:
          {' '}
          {filtered.length}
        </div>
      )}

      {/* Only show when user typed a search */}
      {!loading && !error && queryIsActive && filtered.length === 0 && (
        <div className={styles.noResults}>
          No stores found for your search.
        </div>
      )}

      {/* Helpful hint if stores exist but geocoding returned nothing */}
      {!loading && !error && storeCount > 0 && filtered.length === 0 && (
        <div className={styles.warningAlert}>
          Stores loaded, but address-to-coordinates returned no results.
        </div>
      )}

      <div className={styles.list}>
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/vendors/${s.id}`}
            className={styles.cardButton}
            style={{ textDecoration: 'none', color: 'inherit' }}
            prefetch
          >
            <div className={styles.storeCardName}>{s.name}</div>
            <div className={styles.storeCardLocation}>
              {s.location}
            </div>
            <div className={styles.storeCardHours}>
              {hoursPreview(s.hours)}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
