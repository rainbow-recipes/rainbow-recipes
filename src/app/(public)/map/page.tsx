import 'leaflet/dist/leaflet.css';
import StoreMap from '@/components/map/StoreMap';

export default function MapPage() {
  return (
    <main
      style={{
        padding: '1.5rem',
        maxWidth: 1300,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <h1 style={{ fontSize: '1.8rem', marginBottom: '.25rem' }}>
        Vendor Map
      </h1>
      <p style={{ opacity: 0.75, marginTop: 0, marginBottom: '1.25rem' }}>
        Find stores, check locations, and plan your shopping run.
      </p>

      <StoreMap />
    </main>
  );
}
