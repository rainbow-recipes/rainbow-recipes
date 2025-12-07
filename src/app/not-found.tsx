import { Container } from 'react-bootstrap';
import { EmojiFrown } from 'react-bootstrap-icons';

/* Render a Not Found page if the user enters a URL that doesn't match any route. */
const NotFound = () => (
  <Container className="py-3">
    <Container
      className="py-4 d-flex align-items-center flex-column justify-content-center"
      style={{ minHeight: '70vh' }}
    >
      <h3 className="text-center text-secondary">
        <EmojiFrown className="mb-3" size="2em" />
        <p>Oops! Page not found.</p>
      </h3>
    </Container>
  </Container>
);

export default NotFound;
