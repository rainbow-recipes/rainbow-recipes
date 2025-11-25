'use client';

import { Card } from 'react-bootstrap';
import { Store } from '@prisma/client';
import Link from 'next/link';
import defaultImage from '../../public/default-store-image.png';

const VendorCard = ({ store }: { store: Store }) => (
  <Card className="h-100 text-start" style={{ width: '16rem' }}>
    {(store.image === null) && (
      <Card.Img variant="top" src={defaultImage.src} alt={`${store.name}`} />
    )}
    {store.image !== null && (
      <Card.Img variant="top" src={store.image} alt={`${store.name}`} />
    )}
    <Card.Body>
      <Card.Title>{store.name}</Card.Title>
      <Card.Text>
        {store.website ? (
          <Link
            href={store.website.startsWith('http') ? store.website : `https://${store.website}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {store.website}
          </Link>
        ) : null}
      </Card.Text>
    </Card.Body>
  </Card>
);

export default VendorCard;
