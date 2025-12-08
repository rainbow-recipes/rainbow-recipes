import { prisma } from '@/lib/prisma';
import ReviewVendorForm from '@/components/vendors/reviews/ReviewVendorForm';
import { getServerSession } from 'next-auth';
import { loggedInProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import notFound from '@/app/not-found';
import { Container, Alert } from 'react-bootstrap';
import Link from 'next/link';

export default async function ReviewVendorPage({ params }: { params: { id: string } }) {
  // Protect the page, only logged in users can access it.
  const session = await getServerSession(authOptions);
  loggedInProtectedPage(
    session as {
      user: { email: string; id: string; role: string };
    } | null,
  );

  const storeId = params.id;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      owner: true,
    },
  });

  if (!store) {
    return notFound();
  }

  // Prevent store owner from reviewing their own store
  if (store.owner === session?.user?.email) {
    return (
      <Container className="py-4">
        <h1>Review Vendor</h1>
        <p className="text-muted mb-4">
          Vendor:
          {' '}
          <Link href={`/vendors/${store.id}`} className="text-decoration-none fw-bold">
            {store.name}
          </Link>
        </p>
        <Alert variant="warning">
          You cannot review your own store.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1>Review Vendor</h1>
      <p className="text-muted mb-4">
        Vendor:
        {' '}
        <Link href={`/vendors/${store.id}`} className="text-decoration-none fw-bold">
          {store.name}
        </Link>
      </p>
      <ReviewVendorForm storeId={store.id} />
    </Container>
  );
}
