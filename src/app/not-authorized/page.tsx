import { Container } from 'react-bootstrap';
import { ExclamationTriangle } from 'react-bootstrap-icons';

/** Render a Not Authorized page if the user enters a URL that they don't have authorization for. */
export default function NotAuthorized() {
  return (
    <main>
      <Container
        className="py-4 d-flex align-items-center flex-column justify-content-center"
        style={{ minHeight: '70vh' }}
      >
        <h3 className="text-center">
          <ExclamationTriangle className="mb-2" size="2em" />
          <p>Not Authorized</p>
        </h3>
      </Container>
    </main>
  );
}
