import { getServerSession } from 'next-auth';
import { Col, Container, Row } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { vendorProtectedPage } from '@/lib/page-protection';
import { authOptions } from '@/lib/auth';

const MyStorePage = async () => {
  const session = await getServerSession(authOptions);
  vendorProtectedPage(session as any);
  // prefer using the session user id (more reliable than email)
  const userId = (session && session.user && (session.user as any).id) || '';
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;
  const storeName = user?.storeName ?? 'My Store';

  return (
    <main>
      <Container id="list" fluid className="py-3">
        <Row>
          <Col>
            <h1>{storeName}</h1>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default MyStorePage;
