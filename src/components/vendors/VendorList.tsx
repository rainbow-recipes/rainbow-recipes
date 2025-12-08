'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Col, Row } from 'react-bootstrap';
import type { Store } from '@prisma/client';
import VendorCard from './VendorCard';

interface VendorListProps {
  stores: Store[];
}

export default function VendorList({ stores }: VendorListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStores = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return stores
      .filter((store) => store.name !== 'My Store') // Maintain existing filter logic
      .filter((store) => {
        if (!term) return true;

        const inName = store.name.toLowerCase().includes(term);
        const inLocation = store.location.toLowerCase().includes(term);
        return inName || inLocation;
      });
  }, [stores, searchTerm]);

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          className="form-control form-control-lg rounded-pill px-4"
          placeholder="Search vendors by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Row className="g-4">
        {filteredStores.map((store) => (
          <Col key={store.id} xs={6} md="auto">
            <Link href={`/vendors/${store.id}`} className="text-decoration-none text-dark">
              <VendorCard store={store} />
            </Link>
          </Col>
        ))}
      </Row>
    </>
  );
}
