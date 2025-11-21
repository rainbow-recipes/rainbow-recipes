/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Container, Nav, Navbar, NavDropdown,
} from 'react-bootstrap';
import {
  BoxArrowRight, Lock, PersonFill, PersonPlusFill,
} from 'react-bootstrap-icons';

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const pathName = usePathname();

  const currentUserEmail = session?.user?.email ?? '';
  const currentUserName = (session?.user as any)?.username ?? '';

  // includes role from auth.ts
  const userWithRole = session?.user as { email?: string; role?: string } | undefined;
  const role = userWithRole?.role;

  const isLoggedIn = !!currentUserEmail;
  const isAdmin = role === 'ADMIN';

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="/recipes">Recipe App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">

          {/* Left side navigation */}
          <Nav className="me-auto justify-content-start">
            {isLoggedIn && (
              <>
                <Nav.Link
                  id="recipes-nav"
                  href="/recipes"
                  active={pathName === '/recipes'}
                >
                  All Recipes
                </Nav.Link>

                <Nav.Link
                  id="add-recipe-nav"
                  href="/add-recipe"
                  active={pathName === '/add-recipe'}
                >
                  Add Recipe
                </Nav.Link>

                <Nav.Link
                  id="my-recipes-nav"
                  href="/my-recipes"
                  active={pathName === '/my-recipes'}
                >
                  My Recipes
                </Nav.Link>
                <Nav.Link
                  id="favorites-nav"
                  href="/favorites-page"
                  active={pathName === '/favorites-page'}
                >
                  Favorites
                </Nav.Link>
              </>
            )}

            {isLoggedIn && isAdmin && (
              <Nav.Link
                id="admin-nav"
                href="/admin"
                active={pathName === '/admin'}
              >
                Admin
              </Nav.Link>
            )}
          </Nav>

          {/* Right side Auth */}
          <Nav>
            {isLoggedIn ? (
              <NavDropdown id="login-dropdown" title={currentUserName}>
                <NavDropdown.Item
                  id="login-dropdown-sign-out"
                  onClick={() => signOut({ callbackUrl: '/signin' })}
                >
                  <BoxArrowRight className="me-1" />
                  Sign Out
                </NavDropdown.Item>

                <NavDropdown.Item
                  id="login-dropdown-change-password"
                  href="/auth/change-password"
                >
                  <Lock className="me-1" />
                  Change Password
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown id="login-dropdown" title="Login">
                <NavDropdown.Item
                  id="login-dropdown-sign-in"
                  href="/signin"
                >
                  <PersonFill className="me-1" />
                  Sign in
                </NavDropdown.Item>

                <NavDropdown.Item
                  id="login-dropdown-sign-up"
                  href="/signup"
                >
                  <PersonPlusFill className="me-1" />
                  Sign up
                </NavDropdown.Item>

                {/* ✅ Vendor / Merchant Signup */}
                <NavDropdown.Item
                  id="login-dropdown-vendor-sign-up"
                  href="/merchant-signup"
                >
                  <PersonPlusFill className="me-1" />
                  Vendor Sign Up
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
