import React from 'react';
import './footer.css';
import Link from 'next/link';
import { CCircle, Github } from 'react-bootstrap-icons';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="rr-footer">
      <div className="rr-footer-inner">
        <div className="rr-footer-brand">
          <span className="rr-footer-logo">🌈 Rainbow Recipes</span>
          <p className="rr-footer-tagline">
            Easy, fast, and affordable meals for UH students.
          </p>
        </div>

        <nav className="rr-footer-links" aria-label="Footer navigation">
          <a href="/recipes">Recipes</a>
          <a href="/favorites">Favorites</a>
          <a href="/vendors">Vendors</a>
          <a href="/about">About</a>
        </nav>

        <div className="rr-footer-meta">
          <span className="d-flex align-items-center gap-1">
            <CCircle />
            <Link
              href="https://github.com/rainbow-recipes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-decoration-none"
            >
              {year}
              {' '}
              Rainbow Recipes
            </Link>
          </span>
          <span className="rr-footer-separator">•</span>
          <span className="d-flex align-items-center gap-1">
            View this site on
            {' '}
            <Link
              href="https://github.com/rainbow-recipes/rainbow-recipes"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
            <Github />
          </span>
          <span className="rr-footer-made">Made for UH Mānoa students</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
