import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL = process.env.NOMINATIM_EMAIL;
const FETCH_TIMEOUT = 8000; // 8 second timeout
const MAX_QUERY_LENGTH = 256;

// ============ Types ============
interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  provider: 'nominatim' | 'photon';
  usedQuery: string;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name: string;
  };
}

// ============ Utilities ============
function normalize(q: string): string {
  return q.trim().replace(/\s+/g, ' ');
}

function buildCandidates(raw: string): string[] {
  const q = normalize(raw);
  const parts = q.split(',').map((p) => p.trim()).filter(Boolean);

  // Start with the full query
  const candidates = [q];

  // If multiple parts, try dropping the first part (likely business name)
  // and try just the last few parts (address core)
  if (parts.length >= 2) {
    const addressOnly = parts.slice(1).join(', ');
    candidates.push(addressOnly);

    if (parts.length >= 3) {
      const lastThree = parts.slice(-3).join(', ');
      if (lastThree !== addressOnly) {
        candidates.push(lastThree);
      }
    }
  }

  // Deduplicate while preserving order
  return [...new Set(candidates)];
}

function createFetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

// ============ Geocoding Services ============
async function nominatimSearch(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
  });

  if (EMAIL) params.set('email', EMAIL);

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  try {
    const res = await createFetchWithTimeout(url, {
      headers: {
        'User-Agent': EMAIL
          ? `RainbowRecipes/1.0 (${EMAIL})`
          : 'RainbowRecipes/1.0 (local dev)',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      console.error(`Nominatim error: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as NominatimItem[] | unknown;
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const first = data[0] as NominatimItem;
    const lat = Number(first.lat);
    const lng = Number(first.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      displayName: first.display_name || query,
      provider: 'nominatim',
      usedQuery: query,
    };
  } catch (error) {
    console.error('Nominatim fetch error:', error);
    return null;
  }
}

async function photonSearch(query: string): Promise<GeocodeResult | null> {
  const url = `https://photon.komoot.io/api/?${
    new URLSearchParams({
      q: query,
      limit: '1',
      lang: 'en',
    }).toString()}`;

  try {
    const res = await createFetchWithTimeout(url, {});

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { features?: PhotonFeature[] } | unknown;

    const features = (data as any)?.features;
    if (!Array.isArray(features) || features.length === 0) {
      return null;
    }

    const feature = features[0];
    if (!feature) {
      return null;
    }

    const coords = feature.geometry?.coordinates;
    if (!coords || coords.length < 2) {
      return null;
    }

    const lng = Number(coords[0]);
    const lat = Number(coords[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return {
      lat,
      lng,
      displayName: feature.properties?.name || query,
      provider: 'photon',
      usedQuery: query,
    };
  } catch (error) {
    console.error('Photon fetch error:', error);
    return null;
  }
}

// ============ Handler ============
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  // Validation
  if (!q || !normalize(q)) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: 'Query too long' },
      { status: 400 },
    );
  }

  const candidates = buildCandidates(q);

  // Try each candidate with both services in parallel
  for (const candidate of candidates) {
    // Race between Nominatim and Photon, return first success
    const result = await Promise.race([
      nominatimSearch(candidate),
      photonSearch(candidate),
    ]).catch(() => null);

    if (result) {
      return NextResponse.json({ result });
    }
  }

  // No result from any candidate
  return NextResponse.json({ result: null });
}
