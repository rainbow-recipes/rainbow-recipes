'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Container,
} from 'react-bootstrap';
import './Navbar.css';
import {
  Basket2, Person, PersonCircle, PersonPlus, JournalText, PlusLg, BoxArrowRight, SuitHeartFill,
} from 'react-bootstrap-icons';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isLoggedIn = !!session?.user;
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const isMerchant = (session?.user as any)?.isMerchant === true;

  function isActive(p: string, target: string) {
    return p === target;
  }

  return (
    <BootstrapNavbar
      expand="lg"
      fixed="top"
      style={{ backgroundColor: '#024731' }}
      variant="dark"
      className="shadow-sm"
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} href="/" className="nav-link-custom">
          <span className="d-inline-flex align-items-center">
            <span
              className="me-2 d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
            >
              🍲
            </span>
            <span className="fw-semibold">Rainbow Recipes</span>
          </span>
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAdmin && (
              <Nav.Link
                as={Link}
                href="/admin"
                className={`nav-link-custom ${isActive(pathname, '/admin') ? 'active' : ''}`}
              >
                Admin
              </Nav.Link>
            )}
            {isMerchant && (
              <Nav.Link
                as={Link}
                href="/my-store"
                className={`nav-link-custom ${isActive(pathname, '/my-store') ? 'active' : ''}`}
              >
                My Store
              </Nav.Link>
            )}
            <Nav.Link
              as={Link}
              href="/recipes"
              className={`nav-link-custom ${isActive(pathname, '/recipes') ? 'active' : ''}`}
            >
              Recipes
            </Nav.Link>
            <Nav.Link
              as={Link}
              href="/vendors"
              className={`nav-link-custom ${isActive(pathname, '/vendors') ? 'active' : ''}`}
            >
              Vendors
            </Nav.Link>
            <NavDropdown
              title="Categories"
              id="categories-dropdown"
            >
              <NavDropdown.Header>Food Type</NavDropdown.Header>
              <NavDropdown.Item onClick={() => router.push('/recipes?foodType=vegan')}>
                Vegan
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => router.push('/recipes?foodType=vegetarian')}>
                Vegetarian
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => router.push('/recipes?foodType=gluten-free')}>
                Gluten-free
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => router.push('/recipes?foodType=dairy-free')}>
                Dairy-free
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Header>Appliances</NavDropdown.Header>
              <NavDropdown.Item onClick={() => router.push('/recipes?appliance=oven')}>
                Oven
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => router.push('/recipes?appliance=stovetop')}>
                Stovetop
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => router.push('/recipes?appliance=blender')}>
                Blender
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => router.push('/recipes?appliance=microwave')}>
                Microwave
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => router.push('/recipes?appliance=instant-pot')}>
                Instant Pot
              </NavDropdown.Item>
            </NavDropdown>
            <Nav.Link
              as={Link}
              href="/about"
              className={`nav-link-custom ${isActive(pathname, '/about') ? 'active' : ''}`}
            >
              About
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto">
            {isLoggedIn && (
              <Nav.Link
                as={Link}
                href="/favorites"
                className={`nav-link-custom ${isActive(pathname, '/favorites') ? 'active' : ''}`}
              >
                <div className="d-inline-flex align-items-center gap-2">
                  Favorites
                  <SuitHeartFill />
                </div>
              </Nav.Link>
            )}
            {!isLoggedIn && (
              <Nav.Link
                as={Link}
                href="/vendor-signup"
                className={`nav-link-custom ${isActive(pathname, '/vendor-signup') ? 'active' : ''}`}
              >
                <div className="d-inline-flex align-items-center gap-2">
                  Vendor Sign Up
                  <Basket2 />
                </div>
              </Nav.Link>
            )}
            {!isLoggedIn ? (
              <NavDropdown
                title="Log In"
                id="login-dropdown"
              >
                <NavDropdown.Item as={Link} href="/signin" className="d-flex align-items-center gap-2">
                  <Person />
                  Sign In
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} href="/signup" className="d-flex align-items-center gap-2">
                  <PersonPlus />
                  Sign Up
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown
                title={`Hello, ${session?.user?.email}`}
                id="user-dropdown"
              >
                {/* 👇 NEW: Profile link */}
                <NavDropdown.Item
                  as={Link}
                  href="/profile"
                  className="text-decoration-none d-flex align-items-center gap-2"
                >
                  <PersonCircle />
                  Profile
                </NavDropdown.Item>

                <NavDropdown.Item
                  as={Link}
                  href="/recipes/my-recipes"
                  className="text-decoration-none d-flex align-items-center gap-2"
                >
                  <JournalText />
                  My Recipes
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  href="/recipes/add"
                  className="text-decoration-none d-flex align-items-center gap-2"
                >
                  <PlusLg />
                  Add Recipe
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={() => signOut({ callbackUrl: '/' })}
                  style={{ cursor: 'pointer' }}
                  className="d-flex align-items-center gap-2"
                >
                  Sign Out
                  <BoxArrowRight />
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
