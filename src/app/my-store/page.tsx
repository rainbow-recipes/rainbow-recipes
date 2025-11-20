import { getServerSession } from 'next-auth';
import { Col, Container, Row, Table } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { vendorProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';

const MyStore = async () => {
  const session = await getServerSession(authOptions);
  vendorProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );
  const userEmail = (session && session.user && session.user.email) || '';
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });
  const storeName = user?.storeName || 'My Store';

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

export default MyStore;
