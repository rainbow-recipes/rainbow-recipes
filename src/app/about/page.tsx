'use client';

import Link from 'next/link';
import { Container, Row, Col } from 'react-bootstrap';
import { useEffect } from 'react';
import './page.css';

export default function AboutPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="w-100">
      {/* Hero Section */}
      <div className="py-5 fade-in" style={{ backgroundColor: '#f8f9fa' }}>
        <Container className="text-center py-5" style={{ maxWidth: '850px' }}>
          <h1 className="display-4 fw-bold text-dark mb-4">
            <i className="bi bi-rainbow me-3 text-success"></i>
            About Rainbow Recipes
          </h1>
          <h2 className="fs-3 text-muted mb-4">
            Connecting UH students with affordable, delicious meals and local ingredients
          </h2>
        </Container>
      </div>

      {/* What is Rainbow Recipes Section */}
      <div className="container py-5 fade-in">
        <Row className="justify-content-center">
          <Col lg={10}>
            <h3 className="fw-bold mb-4">
              <i className="bi bi-info-circle-fill me-2 text-success"></i>
              What is Rainbow Recipes?
            </h3>
            <p className="text-muted fs-5 mb-4 lh-base">
              Rainbow Recipes is a comprehensive platform designed specifically for University of Hawaii students 
              to discover quick, affordable, and delicious meal options. We understand the challenges of student 
              life — tight budgets, limited time, and the need for convenient ingredient sourcing around campus.
            </p>
            <p className="text-muted fs-5 lh-base">
              Our platform bridges the gap between wanting to cook healthy, budget-friendly meals and knowing 
              where to find the ingredients and recipes that work for your lifestyle. Whether you're living in 
              the dorms or off-campus, Rainbow Recipes helps you eat well without breaking the bank.
            </p>
          </Col>
        </Row>
      </div>

      <hr className="my-5" />

      {/* Features Overview Section */}
      <div className="container py-5 fade-in">
        <h3 className="fw-bold text-center mb-5">
          <i className="bi bi-stars me-2 text-success"></i>
          What You Can Do With Rainbow Recipes
        </h3>
        <Row className="row-cols-1 row-cols-md-3 g-4">
          {/* Feature 1 */}
          <Col xs={12} md={4}>
            <div className="p-4 bg-white shadow-sm rounded h-100 text-center">
              <div className="fs-1 mb-3">
                <span role="img" aria-label="bowl icon">🍲</span>
              </div>
              <h4 className="fw-semibold mb-3">Find Affordable Recipes</h4>
              <p className="text-muted">
                Browse our collection of budget-friendly recipes designed for college life. Filter by cost, 
                prep time, dietary restrictions, and cooking appliances to find meals that fit your needs.
              </p>
            </div>
          </Col>

          {/* Feature 2 */}
          <Col xs={12} md={4}>
            <div className="p-4 bg-white shadow-sm rounded h-100 text-center">
              <div className="fs-1 mb-3">
                <span role="img" aria-label="shopping cart icon">🛒</span>
              </div>
              <h4 className="fw-semibold mb-3">Locate Ingredient Vendors</h4>
              <p className="text-muted">
                Discover local stores, markets, and vendors around UH Mānoa where you can purchase 
                fresh ingredients. Find store hours, locations, and pricing information all in one place.
              </p>
            </div>
          </Col>

          {/* Feature 3 */}
          <Col xs={12} md={4}>
            <div className="p-4 bg-white shadow-sm rounded h-100 text-center">
              <div className="fs-1 mb-3">
                <span role="img" aria-label="star icon">⭐</span>
              </div>
              <h4 className="fw-semibold mb-3">Save Your Favorite Meals</h4>
              <p className="text-muted">
                Create your personal collection of go-to recipes. Save your favorites and build 
                a personalized cookbook of meals that work for your taste and budget.
              </p>
            </div>
          </Col>
        </Row>
      </div>

      <hr className="my-5" />

      {/* Why This Matters Section */}
      <div className="py-5 fade-in" style={{ backgroundColor: '#f8f9fa' }}>
        <Container className="py-5" style={{ maxWidth: '850px' }}>
          <Row className="justify-content-center">
            <Col lg={10}>
              <h3 className="fw-bold mb-4">
                <i className="bi bi-heart-fill me-2 text-success"></i>
                Why This Matters to UH Students
              </h3>
              <p className="text-muted fs-5 mb-4 lh-base">
                As students, we know the struggle is real. Between tuition, textbooks, and living expenses, 
                food often becomes an afterthought or a source of stress. Many students resort to expensive 
                takeout or unhealthy processed foods because they don't know how to cook affordably or where 
                to shop for fresh ingredients near campus.
              </p>
              <p className="text-muted fs-5 mb-4 lh-base">
                Most dorm kitchens have limited equipment — maybe just a microwave, mini-fridge, and if you're 
                lucky, a hot plate. Off-campus housing might have a full kitchen, but without a car, getting 
                to grocery stores can be challenging. Rainbow Recipes addresses these real challenges by focusing 
                on recipes that work with minimal equipment and highlighting vendors accessible by walking, 
                biking, or public transport.
              </p>
              <p className="text-muted fs-5 lh-base">
                We believe that good nutrition shouldn't be a luxury. By connecting students with practical 
                recipes and local ingredient sources, we're helping build a healthier, more food-secure 
                campus community — one meal at a time.
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <hr className="my-5" />

      {/* How It Works Section */}
      <div className="container py-5 fade-in">
        <Row className="justify-content-center">
          <Col lg={10}>
            <h3 className="fw-bold mb-4">
              <i className="bi bi-gear-fill me-2 text-success"></i>
              How It Works
            </h3>
            
            <div className="d-flex align-items-start gap-3 mb-4">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#00664F',
                  minWidth: '32px',
                }}
              >
                1
              </div>
              <div>
                <h5 className="fw-bold mb-2">
                  <Link href="/recipes" className="text-success fw-semibold text-decoration-none deep-link">
                    Browse Recipes
                  </Link>
                </h5>
                <p className="text-muted mb-0">
                  Explore our curated collection of student-friendly recipes. Use filters to find meals 
                  that match your budget, time constraints, and dietary preferences.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3 mb-4">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#00664F',
                  minWidth: '32px',
                }}
              >
                2
              </div>
              <div>
                <h5 className="fw-bold mb-2">
                  <Link href="/list" className="text-success fw-semibold text-decoration-none deep-link">
                    Explore Vendors
                  </Link>
                </h5>
                <p className="text-muted mb-0">
                  Find local stores and vendors where you can purchase the ingredients you need. 
                  Check store locations, hours, and connect with local merchants around campus.
                </p>
              </div>
            </div>

            <div className="d-flex align-items-start gap-3 mb-4">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#00664F',
                  minWidth: '32px',
                }}
              >
                3
              </div>
              <div>
                <h5 className="fw-bold mb-2">
                  <Link href="/favorites-page" className="text-success fw-semibold text-decoration-none deep-link">
                    Save Your Favorites
                  </Link>
                </h5>
                <p className="text-muted mb-0">
                  Create an account to save your favorite recipes and build your personal collection. 
                  Keep track of the meals you love and want to make again.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <hr className="my-5" />

      {/* Meet the Team Section */}
      <div className="py-5 fade-in" style={{ backgroundColor: '#f8f9fa' }}>
        <Container className="py-5" style={{ maxWidth: '850px' }}>
          <h3 className="fw-bold text-center mb-5">
            <i className="bi bi-people-fill me-2 text-success"></i>
            Meet the Team
          </h3>
          <Row className="justify-content-center">
            <Col xs={12} sm={6} lg={3} className="mb-4">
              <div className="card shadow-sm rounded-4 p-4 text-center border-0 h-100">
                <div className="mb-3">
                  <i className="bi bi-person-circle fs-1 text-success"></i>
                </div>
                <h5 className="fw-semibold mb-0">Ievgen B.</h5>
              </div>
            </Col>
            <Col xs={12} sm={6} lg={3} className="mb-4">
              <div className="card shadow-sm rounded-4 p-4 text-center border-0 h-100">
                <div className="mb-3">
                  <i className="bi bi-person-circle fs-1 text-success"></i>
                </div>
                <h5 className="fw-semibold mb-0">Jasmine C.</h5>
              </div>
            </Col>
            <Col xs={12} sm={6} lg={3} className="mb-4">
              <div className="card shadow-sm rounded-4 p-4 text-center border-0 h-100">
                <div className="mb-3">
                  <i className="bi bi-person-circle fs-1 text-success"></i>
                </div>
                <h5 className="fw-semibold mb-0">Megan W.</h5>
              </div>
            </Col>
            <Col xs={12} sm={6} lg={3} className="mb-4">
              <div className="card shadow-sm rounded-4 p-4 text-center border-0 h-100">
                <div className="mb-3">
                  <i className="bi bi-person-circle fs-1 text-success"></i>
                </div>
                <h5 className="fw-semibold mb-0">Tylor N.</h5>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Quote Section */}
      <div className="container py-5 fade-in">
        <blockquote className="blockquote text-center my-5">
          <p className="fs-4 fst-italic text-dark">
            "Cooking on a student budget shouldn't be stressful."
          </p>
          <footer className="blockquote-footer mt-3">
            <cite title="Rainbow Recipes Team">Rainbow Recipes Team</cite>
          </footer>
        </blockquote>
      </div>

      <hr className="my-5" />

      {/* Project Info Section */}
      <div className="container py-5 fade-in">
        <Row className="justify-content-center">
          <Col lg={8} className="text-center">
            <h3 className="fw-bold mb-4">
              <i className="bi bi-code-square me-2 text-success"></i>
              About This Project
            </h3>
            <p className="text-muted fs-5 mb-4">
              Built by UH Mānoa students for ICS 314: Software Engineering
            </p>
            <p className="text-muted">
              Rainbow Recipes is powered by modern web technologies including Next.js, 
              Prisma, and NeonDB to provide a fast, reliable, and user-friendly experience 
              for the UH community.
            </p>
          </Col>
        </Row>
      </div>

      {/* Call to Action Section */}
      <div className="py-5 text-center fade-in" style={{ backgroundColor: '#00664F' }}>
        <Container className="py-5" style={{ maxWidth: '850px' }}>
          <h3 className="fw-bold mb-4 text-white">
            <i className="bi bi-rocket-takeoff me-2"></i>
            Ready to Start Cooking?
          </h3>
          <p className="text-white fs-5 mb-4 opacity-75">
            Join the Rainbow Recipes community and discover your next favorite meal today.
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
            <Link
              href="/recipes"
              className="btn btn-lg rounded-pill px-4 text-decoration-none fw-semibold text-white"
              style={{ backgroundColor: '#00A86B', borderColor: '#00A86B' }}
            >
              Browse Recipes
            </Link>

            <Link
              href="/list"
              className="btn btn-outline btn-lg rounded-pill px-4 text-decoration-none fw-semibold bg-white"
              style={{ borderColor: '#00A86B', color: '#00A86B' }}
            >
              Find Vendors
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
}