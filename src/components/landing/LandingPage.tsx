/* eslint-disable react/require-default-props */

import Link from 'next/link';
import { Container, Row, Col } from 'react-bootstrap';
import './LandingPage.css';

interface LandingPageProps {
  role?: string;
  userName?: string;
}

interface UserLandingProps {
  userName: string;
}

function GuestLanding() {
  return (
    <div className="w-100">
      {/* HERO SECTION */}
      <div className="rr-hero">
        <Container className="text-center py-5 rr-hero-content" style={{ maxWidth: '800px' }}>
          <h1 className="display-4 fw-bold text-white mb-4">
            Rainbow Recipes
          </h1>

          <h2 className="fs-3 text-white-50 mb-4">
            Easy and fast recipes for UH students!
          </h2>

          <p className="text-white-50 fs-5 mb-4 lh-base">
            Rainbow Recipes helps students find quick, affordable meals
            and discover where to buy ingredients nearby. Start exploring and
            cook up something delicious today!
          </p>

          <Link
            href="/recipes"
            className="btn btn-success btn-lg rounded-pill px-4 py-2 text-decoration-none"
          >
            Browse Recipes
          </Link>
          <Link
            href="/lucky"
            className="btn btn-success btn-lg rounded-pill px-4 py-2 text-decoration-none"
          >
            I&posm feeling lucky!
          </Link>
        </Container>
      </div>
      {/* FEATURE SECTION */}
      <Container className="py-5">
        <h3 className="display-6 fw-bold text-center mt-4 mb-5">
          What you can do with Rainbow Recipes
        </h3>

        <Row className="g-5 text-center">
          {/* Feature 1 */}
          <Col md={4}>
            <div className="d-flex flex-column align-items-center">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#00a86b33',
                }}
              >
                <span className="fs-1">🍲</span>
              </div>
              <h4 className="fs-4 fw-semibold mb-3">Find Cheap Meals</h4>
              <p className="text-muted">
                Browse affordable recipes perfect for college life — fast,
                cheap, and easy to make with minimal ingredients.
              </p>
            </div>
          </Col>

          {/* Feature 2 */}
          <Col md={4}>
            <div className="d-flex flex-column align-items-center">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(0, 168, 107, 0.2)',
                }}
              >
                <span className="fs-1">🛒</span>
              </div>
              <h4 className="fs-4 fw-semibold mb-3">Find Local Vendors</h4>
              <p className="text-muted">
                Learn where to purchase ingredients around UH — including local
                vendors, shops, and campus options.
              </p>
            </div>
          </Col>

          {/* Feature 3 */}
          <Col md={4}>
            <div className="d-flex flex-column align-items-center">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#00a86b33',
                }}
              >
                <span className="fs-1">⭐</span>
              </div>
              <h4 className="fs-4 fw-semibold mb-3">Student Friendly</h4>
              <p className="text-muted">
                Designed for UH students — focused on quick meals, realistic
                portions, and ingredients easy to find in Mānoa.
              </p>
            </div>
          </Col>
        </Row>
      </Container>

      <hr className="my-5" />

      {/* CALL TO ACTION SECTION */}
      <Container className="text-center py-5" style={{ maxWidth: '800px' }}>
        <h3 className="display-6 fw-bold mb-4">Ready to Start Cooking?</h3>
        <p className="text-muted fs-5 mb-4">
          Check out our full list of recipes or explore local vendors to begin
          your cooking journey with fresh, reliable ingredients.
        </p>

        <div className="d-flex justify-content-center gap-3">
          <Link
            href="/recipes"
            className="btn btn-success btn-lg rounded-pill px-4 py-2"
          >
            Browse Recipes
          </Link>

          <Link
            href="/vendors"
            className="btn btn-outline-success rounded-pill px-4 justify-content-center d-flex align-items-center"
          >
            Find Vendors
          </Link>
        </div>
      </Container>
      <div className="py-5" />
    </div>
  );
}

function UserLanding({ userName = 'User' }: UserLandingProps) {
  return (
    <div className="w-100">
      {/* HERO SECTION */}
      <div className="rr-hero">
        <Container
          className="d-flex flex-column justify-content-center text-center py-5 rr-hero-content"
          style={{ maxWidth: '800px', height: '70vh' }}
        >
          <h1 className="display-4 fw-bold text-white mb-4">
            Welcome back,
            {userName}
            !
          </h1>

          <h2 className="fs-3 text-white-50 mb-4">
            Ready to discover your next favorite recipe?
          </h2>

          <div className="d-flex justify-content-center gap-3 mt-4">
            <Link
              href="/recipes"
              className="btn btn-success btn-lg rounded-pill px-4 py-2 text-decoration-none"
            >
              Browse Recipes
            </Link>

            <Link
              href="/favorites"
              className="btn btn-success btn-lg rounded-pill px-4 py-2 text-decoration-none"
            >
              Favorite Recipes
            </Link>

            <Link
              href="/lucky"
              className="btn btn-success btn-lg rounded-pill px-4 py-2 text-decoration-none"
            >
              I&apos;m feeling lucky!
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default function LandingPage({ role = 'guest', userName = 'User' }: LandingPageProps) {
  if (role === 'user') return <UserLanding userName={userName} />;
  return <GuestLanding />;
}

(LandingPage as any).defaultProps = {
  role: 'guest',
  userName: 'User',
};
