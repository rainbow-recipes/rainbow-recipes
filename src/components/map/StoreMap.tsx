/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMap } from 'react-leaflet';
import { getStores } from '@/lib/dbActions';
import styles from './StoreMap.module.css';
import 'leaflet/dist/leaflet.css';

// react-leaflet dynamic imports (client-only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false },
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false },
);

// Replace dynamic import with standard import for leaflet
let L: typeof import('leaflet');

if (typeof window !== 'undefined') {
  import('leaflet').then((module) => {
    L = module;
  });
}

type StoreDTO = {
  id: string;
  name: string;
  website: string | null;
  location: string; // address string from schema
  hours: string[];
  image: string | null;
  owner: string;
};

type GeocodeResult = {
  lat: number;
  lng: number;
  displayName?: string;
  provider?: string;
  usedQuery?: string;
};

type LocatedStore = StoreDTO & {
  lat: number;
  lng: number;
  displayName?: string;
  provider?: string;
  usedQuery?: string;
};

const DEFAULT_CENTER: [number, number] = [21.3069, -157.8583];
const DEFAULT_ZOOM = 12;

async function fetchStores(): Promise<StoreDTO[]> {
  const stores = await getStores();
  return stores ?? [];
}

async function geocode(location: string): Promise<GeocodeResult | null> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(location)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

// Optional convenience: support "lat,lng" string in Store.location
function parseLatLng(raw: string) {
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function hoursPreview(hours: string[]) {
  if (!hours?.length) return 'Hours not listed';
  return hours.slice(0, 2).join(' • ') + (hours.length > 2 ? ' • ...' : '');
}

/**
 * Forces Leaflet to recalc size after layout paints.
 */
function InvalidateSizeOnce() {
  const map = useMap();

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 0);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);

  return null;
}

/**
 * Custom SVG pin icon (no Leaflet PNG dependency).
 * Big, clear, and reliable in Next bundling.
 */
function createPinIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
      <path fill="#111111" d="M12 2c-3.314 0-6 2.686-6 6c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z"/>
      <circle cx="12" cy="8" r="2.5" fill="#ffffff"/>
    </svg>
  `.trim();

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return L.icon({
    iconUrl: url,
    iconSize: [36, 36],
    iconAnchor: [18, 34],
    popupAnchor: [0, -28],
  });
}

export default function StoreMap() {
  const [stores, setStores] = useState<StoreDTO[]>([]);
  const [located, setLocated] = useState<LocatedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');

  // Session cache to reduce repeated geocode calls
  const geoCache = useRef<Map<string, GeocodeResult | null>>(new Map());

  // Ensure `createPinIcon` is only executed on the client side
  const pinIcon = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createPinIcon();
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const s = await fetchStores();
        if (cancelled) return;

        setStores(s);

        const results: LocatedStore[] = [];

        // Sequential geocode (polite to free service)
        for (const store of s) {
          const loc = store.location?.trim();
          // eslint-disable-next-line no-continue
          if (!loc) continue;

          // If location is already "lat,lng"
          const direct = parseLatLng(loc);
          if (direct) {
            results.push({
              ...store,
              lat: direct.lat,
              lng: direct.lng,
              displayName: store.location,
            });
            // eslint-disable-next-line no-continue
            continue;
          }

          let g = geoCache.current.get(loc);
          if (g === undefined) {
            g = await geocode(loc);
            geoCache.current.set(loc, g ?? null);
          }

          if (g && Number.isFinite(g.lat) && Number.isFinite(g.lng)) {
            results.push({
              ...store,
              lat: g.lat,
              lng: g.lng,
              displayName: g.displayName,
              provider: g.provider,
              usedQuery: g.usedQuery,
            });
          }
        }

        if (!cancelled) setLocated(results);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return located;
    return located.filter(
      (s) => s.name.toLowerCase().includes(q)
        || s.location.toLowerCase().includes(q),
    );
  }, [query, located]);

  const center = useMemo<[number, number]>(() => {
    if (filtered.length > 0) return [filtered[0].lat, filtered[0].lng];
    if (located.length > 0) return [located[0].lat, located[0].lng];
    return DEFAULT_CENTER;
  }, [filtered, located]);

  const queryIsActive = query.trim().length > 0;

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Stores Map</h2>
          <span
            style={{
              fontSize: '.75rem',
              opacity: 0.7,
              border: '1px solid rgba(0,0,0,0.1)',
              padding: '2px 6px',
              borderRadius: 999,
            }}
          >
            public
          </span>
        </div>

        <p style={{ opacity: 0.75, marginTop: 8 }}>
          Browse vendors and see where they are located.
        </p>

        <input
          className={styles.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or address..."
        />

        {loading && (
          <div style={{ opacity: 0.7, fontSize: '.9rem', marginTop: 12 }}>
            Loading stores & geocoding addresses...
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: '.6rem',
              borderRadius: 8,
              background: 'rgba(255,0,0,0.06)',
              border: '1px solid rgba(255,0,0,0.18)',
              fontSize: '.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Debug counts */}
        {!loading && !error && (
          <div style={{ marginTop: 10, fontSize: '.85rem', opacity: 0.7 }}>
            Stores loaded:
            {' '}
            {stores.length}
            {' '}
            • Map points:
            {' '}
            {located.length}
          </div>
        )}

        {/* Only show when user typed a search */}
        {!loading && !error && queryIsActive && filtered.length === 0 && (
          <div style={{ opacity: 0.7, fontSize: '.9rem', marginTop: 12 }}>
            No stores found for your search.
          </div>
        )}

        {/* Helpful hint if stores exist but geocoding returned nothing */}
        {!loading && !error && stores.length > 0 && located.length === 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '.6rem',
              borderRadius: 8,
              background: 'rgba(255,165,0,0.08)',
              border: '1px solid rgba(255,165,0,0.25)',
              fontSize: '.9rem',
            }}
          >
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
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div style={{ opacity: 0.75, fontSize: '.88rem' }}>
                {s.location}
              </div>
              <div style={{ opacity: 0.6, fontSize: '.8rem', marginTop: 2 }}>
                {hoursPreview(s.hours)}
              </div>
            </Link>
          ))}
        </div>
      </aside>

      <section className={styles.mapPanel}>
        <MapContainer center={center} zoom={DEFAULT_ZOOM} scrollWheelZoom>
          <InvalidateSizeOnce />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ✅ Proper pin marker */}
          {filtered.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={pinIcon || undefined} // Use `undefined` if `pinIcon` is null
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '.9rem', marginBottom: 6 }}>
                    {s.displayName ?? s.location}
                  </div>

                  {s.website && (
                    <div style={{ marginBottom: 6 }}>
                      <a
                        href={s.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'underline' }}
                      >
                        Website
                      </a>
                    </div>
                  )}

                  <div style={{ fontSize: '.85rem', opacity: 0.8 }}>
                    {hoursPreview(s.hours)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>
    </div>
  );
}
