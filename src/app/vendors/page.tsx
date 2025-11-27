import { PrismaClient } from '@prisma/client';
import VendorCard from '@/components/VendorCard';
import { Col, Row } from 'react-bootstrap';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  const isMerchant = (session?.user as any)?.isMerchant === true;
  const stores = await prisma.store.findMany();

  return (
    <div className="container my-4">
      <h2 className="mb-4">Vendors</h2>
      {(stores.length === 0) && (
        <p>Sorry, there are no vendors at the moment!</p>
      )}
      {(!isMerchant) && (
        <p>
          Interested in becoming a vendor? Fill out this
          {' '}
          <a href="/merchant-signup">form</a>
          {' '}
          to get started!
        </p>
      )}
      {(isMerchant) && (
        <p>
          New vendors, don&apos;t see your store here?
          Update your store information in your
          {' '}
          <a href="/my-store">My Store</a>
          {' '}
          page to get listed!
        </p>
      )}
      <Row xs={1} sm={2} md={2} lg={3} xl={4} className="g-4">
        {stores.map((store) => (
          <Col key={store.id}>
            {(store.name !== 'My Store')
              && (
              <Link href={`/vendors/${store.id}`} className="text-decoration-none text-dark">
                <VendorCard store={store} />
              </Link>
              )}
          </Col>
        ))}
      </Row>
    </div>
  );
}
