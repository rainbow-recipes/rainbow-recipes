'use client';

import { useEffect } from 'react';
import L from 'leaflet';

// Fix for missing default marker icons when bundling with Next.js.
// This does NOT overwrite your global setup; it's scoped to this page usage.
export default function LeafletIconFix() {
  useEffect(() => {
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return null;
}
