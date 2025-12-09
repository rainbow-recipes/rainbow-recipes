import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL = process.env.NOMINATIM_EMAIL;

function normalize(q: string) {
  return q.trim().replace(/\s+/g, ' ');
}

function buildCandidates(raw: string) {
  const q = normalize(raw);
  const parts = q.split(',').map((p) => p.trim()).filter(Boolean);

  const candidates: string[] = [];
  candidates.push(q);

  // If the first part looks like a business name (no digits),
  // try dropping it.
  if (parts.length >= 2 && !/\d/.test(parts[0])) {
    const withoutBusiness = parts.slice(1).join(', ');
    candidates.push(withoutBusiness);
  }

  // Another simplified version: keep last 3-4 parts if available
  if (parts.length >= 3) {
    candidates.push(parts.slice(-4).join(', '));
    candidates.push(parts.slice(-3).join(', '));
  }

  // Deduplicate while preserving order
  return [...new Set(candidates)];
}

async function nominatimSearch(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
  });

  if (EMAIL) params.set('email', EMAIL);

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': EMAIL
        ? `RainbowRecipes/1.0 (${EMAIL})`
        : 'RainbowRecipes/1.0 (local dev)',
      'Accept-Language': 'en',
      Referer: 'http://localhost:3000',
    },
    cache: 'no-store',
  });

  if (!res.ok) return { ok: false as const, status: res.status };

  const data = (await res.json()) as Array<any>;
  if (!data?.length) return { ok: true as const, result: null as any };

  const first = data[0];
  const lat = Number(first.lat);
  const lng = Number(first.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: true as const, result: null as any };
  }

  return {
    ok: true as const,
    result: {
      lat,
      lng,
      displayName: first.display_name ?? query,
      provider: 'nominatim',
      usedQuery: query,
    },
  };
}

// Optional secondary fallback using Photon (also OSM-based)
async function photonSearch(query: string) {
  const url = `https://photon.komoot.io/api/?${
    new URLSearchParams({
      q: query,
      limit: '1',
      lang: 'en',
    }).toString()}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;

  const data = await res.json();
  const feature = data?.features?.[0];
  const coords = feature?.geometry?.coordinates;

  if (!coords || coords.length < 2) return null;

  const lng = Number(coords[0]);
  const lat = Number(coords[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    displayName: feature?.properties?.name ?? query,
    provider: 'photon',
    usedQuery: query,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || !normalize(q)) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const candidates = buildCandidates(q);

  // 1) Try Nominatim with fallbacks
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const r = await nominatimSearch(candidate);

    if (!r.ok) {
      // If Nominatim is rejecting us, surface that
      return NextResponse.json(
        { error: 'Geocoding failed', status: r.status },
        { status: 502 },
      );
    }

    if (r.result) {
      return NextResponse.json({ result: r.result });
    }
  }

  // 2) Try Photon as a last resort
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const r = await photonSearch(candidate);
    if (r) return NextResponse.json({ result: r });
  }

  return NextResponse.json({ result: null });
}
