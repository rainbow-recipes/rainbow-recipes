/* eslint-disable no-await-in-loop */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';
import { getStores } from '@/lib/dbActions';
import styles from './StoreMap.module.css';
import 'leaflet/dist/leaflet.css';
import { StoreSidebar } from './StoreSidebar';
import { StoreMarkers } from './StoreMarkers';

// react-leaflet dynamic imports (client-only)
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false },
);

/**
 * Custom hook to safely load Leaflet and create the pin icon.
 * Only executes on client-side.
 */
function usePinIcon() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    // eslint-disable-next-line global-require
    const L = require('leaflet');

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
  }, []);
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

export default function StoreMap() {
  const [stores, setStores] = useState<StoreDTO[]>([]);
  const [located, setLocated] = useState<LocatedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');

  // Session cache to reduce repeated geocode calls
  const geoCache = useRef<Map<string, GeocodeResult | null>>(new Map());

  // Use custom hook for pin icon
  const pinIcon = usePinIcon();

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

  return (
    <div className={styles.root}>
      <StoreSidebar
        storeCount={stores.length}
        filtered={filtered}
        loading={loading}
        error={error}
        query={query}
        onQueryChange={setQuery}
        hoursPreview={hoursPreview}
      />

      <section className={styles.mapPanel}>
        <MapContainer center={center} zoom={DEFAULT_ZOOM} scrollWheelZoom>
          <InvalidateSizeOnce />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <StoreMarkers
            stores={filtered}
            pinIcon={pinIcon}
            hoursPreview={hoursPreview}
          />
        </MapContainer>
      </section>
    </div>
  );
}
