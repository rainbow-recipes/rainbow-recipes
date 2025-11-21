import { getServerSession } from 'next-auth';
import { Col, Container, Row } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import VendorItemsPanel from '@/components/VendorItemsPanel';

const MyStorePage = async () => {
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
  const store = await prisma.store.findUnique({
    where: { id: id ?? '' },
  });
  const storeName = store?.name ?? 'My Store';
  const website = store?.website;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const itemsRaw = await prisma.item.findMany({
    where: { owner: store?.owner ?? '' },
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
        <div className="d-flex justify-content-between align-items-baseline pb-3">
          <h1>{storeName}</h1>
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
        </div>
        <Container className="pt-4 border rounded-5 p-4">
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
                  {store?.hours.map((hour, i) => (
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
              <VendorItemsPanel items={items} />
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
};

export default MyStorePage;
