import { Col, Container, Row, Image } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { Store } from '@prisma/client';
import notFound from '@/app/not-found';
import Link from 'next/link';
import { ChevronLeft } from 'react-bootstrap-icons';
import StoreItemsPanel from '@/components/storeitem/StoreItemsPanel';

export default async function VendorsPage({ params }: { params: { id: string | string[] } }) {
  const id = String(Array.isArray(params?.id) ? params?.id[0] : params?.id);
  // console.log(id);
  const store: Store | null = await prisma.store.findUnique({
    where: { id },
  });
  // console.log(store);
  if (!store) {
    return notFound();
  }

  const { name: storeName, website, image } = store;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const itemsRaw = await prisma.item.findMany({
    where: { owner: store.owner ?? '' },
  });

  // Make sure items are serializable for the client (numbers/strings/booleans)
  const items = itemsRaw.map((it) => ({
    ...it,
    // ensure price is a plain number
    price: typeof it.price === 'object' && it.price !== null && 'toNumber' in it.price
      ? Number((it.price as any).toString())
      : (it.price as any),
  }));

  return (
    <main>
      <Container id="list" className="py-3">
        <Link href="/vendors" className="d-inline-flex align-items-center mb-3 text-dark">
          <ChevronLeft />
          {' '}
          Back to Vendors
        </Link>
        <Row className="d-flex justify-content-between align-items-center py-3">
          <Col>
            <div className="d-flex align-items-center gap-3">
              {image ? (
                <Image
                  src={image}
                  alt={`${storeName} logo`}
                  className="img-fluid rounded-circle"
                  style={{ width: '75px', height: '75px', objectFit: 'cover' }}
                />
              ) : null}
              <h1 className="mb-0">{storeName}</h1>
            </div>
          </Col>
          <Col>
            {website ? (
              <div className="text-end">
                <h5 className="mb-0">
                  Store Website:
                  {' '}
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {website}
                  </a>
                </h5>
              </div>
            ) : null}
          </Col>
        </Row>
        <Container className="pt-4 shadow-sm rounded-4 p-4 mb-4">
          <Row>
            <Col className="pe-5" xs="auto">
              <h5>Location:</h5>
              <p>{store.location}</p>
              <h5>Hours:</h5>
              <Row>
                <Col xs="auto">
                  {days.map((day) => (
                    <div>
                      {day}
                      :
                    </div>
                  ))}
                </Col>
                <Col xs="auto">
                  {store.hours.map((hour) => (
                    <div>
                      {hour}
                    </div>
                  ))}
                </Col>
              </Row>
            </Col>
            <Col>
              {/* Client-side panel handles search and rendering */}
              {/* @ts-ignore server->client prop */}
              <StoreItemsPanel items={items} isMyStore={false} />
            </Col>
          </Row>
        </Container>
      </Container>
    </main>
  );
}
