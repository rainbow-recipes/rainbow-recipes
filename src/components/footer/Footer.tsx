import React from 'react';
import './footer.css';

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
          <span>
            ©
            {year}
            {' '}
            Rainbow Recipes
          </span>
          <span className="rr-footer-separator">•</span>
          <span>Made for UH Mānoa students</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
