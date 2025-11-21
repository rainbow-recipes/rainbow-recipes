import { getServerSession } from 'next-auth';
import { Col, Container, Row } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

const MyStorePage = async () => {
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );
  // prefer using the session user id (more reliable than email)
  const userId = session?.user?.email;
  const user = userId
    ? await prisma.user.findUnique({ where: { email: userId } })
    : null;
  const storeName = user?.storeName ?? 'My Store';
  const id = user?.id;

  return (
    <main>
      <Container id="list" fluid className="py-3">
        <Row>
          <Col>
            <h1>{storeName}</h1>
            <Link href={`/edit-store/${id}`}>Edit My Store</Link>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default MyStorePage;
