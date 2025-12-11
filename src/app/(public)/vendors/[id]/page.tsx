import { Col, Container, Row, Image } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import notFound from '@/app/not-found';
import Link from 'next/link';
import { ChevronLeft, Star, StarFill } from 'react-bootstrap-icons';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import StoreItemList from '@/components/store-items/StoreItemList';
import VendorReviewsList from '@/components/vendors/reviews/VendorReviewsList';

export default async function VendorsPage({ params }: { params: { id: string | string[] } }) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const id = String(Array.isArray(params?.id) ? params?.id[0] : params?.id);

  const [store, currentUser] = await Promise.all([
    prisma.store.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { id: 'desc' as const },
        },
      },
    }),
    userEmail
      ? prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, role: true },
      })
      : null,
  ]);

  if (!store) {
    return notFound();
  }

  const [itemsRaw, reviewOwners] = await Promise.all([
    prisma.storeItem.findMany({
      where: { owner: store.owner ?? '' },
      include: { databaseItem: true },
    }),
    prisma.user.findMany({
      where: {
        email: {
          in: Array.from(new Set((store.reviews as any[]).map((r) => r.owner))),
        },
      },
      select: { id: true, email: true, firstName: true, lastName: true, name: true },
    }),
  ]);

  // Make sure items are serializable for the client (numbers/strings/booleans)
  const items = itemsRaw.map((it) => ({
    ...it,
    // ensure price is a plain number
    price: typeof it.price === 'object' && it.price !== null && 'toNumber' in it.price
      ? Number((it.price as any).toString())
      : (it.price as any),
  }));

  const ownerMap = new Map(reviewOwners.map((u) => [u.email, u]));

  const reviewsWithUserInfo = (store.reviews as any[]).map((review) => {
    const user = ownerMap.get(review.owner);
    return {
      ...review,
      ownerUserId: user?.id,
      ownerFirstName: user?.firstName,
      ownerLastName: user?.lastName,
      ownerName: user?.name,
    };
  });

  const averageRating = reviewsWithUserInfo.length > 0
    ? (reviewsWithUserInfo.reduce((sum, r) => sum + r.rating, 0) / reviewsWithUserInfo.length)
    : null;

  const { name: storeName, website, image } = store;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
                  className="img-fluid"
                  style={{ maxWidth: '100px', maxHeight: '75px', objectFit: 'fill' }}
                />
              ) : null}
              <h1 className="mb-0" style={{ fontWeight: 'bold' }}>{storeName}</h1>
            </div>
            {averageRating !== null && (
              <div className="mt-2 ms-3">
                <div className="text-warning" style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i}>{i < Math.round(averageRating) ? <StarFill /> : <Star />}</span>
                  ))}
                </div>
                <div className="text-muted small">
                  {averageRating.toFixed(1)}
                  /5 (
                  {reviewsWithUserInfo.length}
                  {' '}
                  {reviewsWithUserInfo.length === 1 ? 'review' : 'reviews'}
                  )
                </div>
              </div>
            )}
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
                  {store.hours.map((hour: string) => (
                    <div>
                      {hour}
                    </div>
                  ))}
                </Col>
              </Row>
            </Col>
            <Col>
              <StoreItemList items={items} mode="publicVendor" showSearch />
            </Col>
          </Row>
        </Container>
        <Container className="pt-4 shadow-sm rounded-4 p-4 mb-4">
          <VendorReviewsList
            reviews={reviewsWithUserInfo}
            storeId={id}
            isLoggedIn={!!session?.user}
            currentUserEmail={userEmail}
            userRole={currentUser?.role}
            storeOwnerEmail={store.owner}
          />
        </Container>
      </Container>
    </main>
  );
}
