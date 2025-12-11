'use client';

import { Card } from 'react-bootstrap';
import { Store } from '@prisma/client';
import defaultImage from '../../../public/default-store-image.png';

export default function VendorCard({ store }: { store: Store }) {
  return (
    <Card className="text-center shadow-sm border-0" style={{ width: '12rem', height: 'fit-content' }}>
      {(store.image === null) && (
      <Card.Img
        variant="top"
        src={defaultImage.src}
        alt={`${store.name}`}
        style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }}
      />
      )}
      {store.image !== null && (
        <Card.Img
          variant="top"
          src={store.image}
          alt={`${store.name}`}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', padding: '0.5rem' }}
        />
      )}
      <Card.Body>
        <Card.Title style={{ fontSize: '0.95rem', marginBottom: '0.125rem', lineHeight: 1 }}>{store.name}</Card.Title>
      </Card.Body>
    </Card>
  );
}
