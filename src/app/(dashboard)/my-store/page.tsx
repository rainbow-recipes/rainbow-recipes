import { getServerSession } from 'next-auth';
import { Col, Container, Row, Image } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { Store } from '@prisma/client';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import MyStoreItemsPanel from '@/components/storeitem/StoreItemsPanel';

export default async function MyStorePage() {
  // Protect the page, only logged in vendors can access it.
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; role: string; isMerchant?: boolean };
    } | null,
  );

  // Session shape may include either `user.id` or `user.email` depending on NextAuth callbacks.
  // Try to resolve the user by id first, then by email as a fallback.
  const sessionUser = session?.user as ({ id?: string; email?: string } | undefined);
  const lookupById = sessionUser?.id;
  const lookupByEmail = sessionUser?.email;
  // eslint-disable-next-line no-nested-ternary
  const user = lookupById
    ? await prisma.user.findUnique({ where: { id: lookupById } })
    : lookupByEmail
      ? await prisma.user.findUnique({ where: { email: lookupByEmail } })
      : null;
  const id = user?.id;
  const store: Store | null = await prisma.store.findUnique({
    where: { id },
  });

  const { name: storeName, website, image } = store ?? {};
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const itemsRaw = await prisma.storeItem.findMany({
    where: { owner: store?.owner ?? '' },
    include: { databaseItem: true },
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
      {(user?.merchantApproved)
        ? (
          <Container id="list" className="py-3">
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
                  <p>{store?.location}</p>
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
                      {store?.hours.map((hour) => (
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
                  <MyStoreItemsPanel items={items} isMyStore />
                </Col>
              </Row>
              <Row>
                <Col className="text-end">
                  <Link href={`/my-store/edit/${id}`} className="btn btn-outline-dark btn-lg rounded-pill">
                    Edit My Store
                  </Link>
                </Col>
              </Row>
            </Container>
          </Container>
        )
        : (
          <Container className="py-5 text-center">
            <h2>Your merchant application is still pending approval.</h2>
          </Container>
        )}
    </main>
  );
}
