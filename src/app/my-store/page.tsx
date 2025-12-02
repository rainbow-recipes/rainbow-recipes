import { getServerSession } from 'next-auth';
import { Col, Container, Row, Image } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { Store } from '@prisma/client';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import notFound from '@/app/not-found';
import Link from 'next/link';
import MyStoreItemsPanel from '@/components/my-store/MyStoreItemsPanel';

export default async function MyStorePage() {
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );
  const userId = session?.user?.email;
  const user = userId
    ? await prisma.user.findUnique({ where: { email: userId } })
    : null;
  const id = user?.id;
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
        <Row className="d-flex justify-content-between align-items-center pb-3">
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
        <Container className="pt-4 shadow-sm rounded-4 p-4">
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
              <MyStoreItemsPanel items={items} />
            </Col>
          </Row>
          <Row>
            <Col className="text-end">
              <Link href={`/edit-store/${id}`} className="btn btn-outline-dark btn-lg rounded-pill">
                Edit My Store
              </Link>
            </Col>
          </Row>
        </Container>
      </Container>
    </main>
  );
}
