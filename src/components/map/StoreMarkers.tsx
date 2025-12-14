'use client';

import dynamic from 'next/dynamic';
import styles from './StoreMap.module.css';

const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false },
);

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

interface StoreMarkersProps {
  stores: LocatedStore[];
  pinIcon: any;
  hoursPreview: (hours: string[]) => string;
}

// eslint-disable-next-line import/prefer-default-export
export function StoreMarkers({
  stores,
  pinIcon,
  hoursPreview,
}: StoreMarkersProps) {
  return (
    <>
      {stores.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={pinIcon || undefined}
        >
          <Popup>
            <div className={styles.popupContent}>
              <div className={styles.popupTitle}>
                {s.name}
              </div>
              <div className={styles.popupLocation}>
                {s.displayName ?? s.location}
              </div>

              {s.website && (
                <div className={styles.popupWebsite}>
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Website
                  </a>
                </div>
              )}

              <div className={styles.popupHours}>
                {hoursPreview(s.hours)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
