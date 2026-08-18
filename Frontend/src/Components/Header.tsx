import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { useTheme } from '../Context/ThemeContext';
import logo from '../assets/Logo-app-v2.png';

const ACCENT = '#38bdf8';

const NAV_LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/about', label: 'A propos' },
  { to: '/skills', label: 'Compétences' },
  { to: '/project', label: 'Projets' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        .app-header {
          transition: background-color 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease;
          background-color: var(--color-header-bg);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          /* Ombre permanente en bas, même hors scroll, pour détacher visuellement
             le header du contenu de la page quelle que soit sa couleur */
          box-shadow: 0 4px 18px var(--color-header-shadow);
        }
        .app-header.is-scrolled {
          background-color: var(--color-header-bg-scrolled);
          box-shadow: 0 6px 24px var(--color-header-shadow);
        }

        .app-header .navbar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0;
          min-width: 0;
        }

        .app-header .brand-logo {
          height: clamp(40px, 9vw, 70px);
          width: auto;
          object-fit: contain;
          flex-shrink: 0;
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        .app-header .navbar-brand:hover .brand-logo {
          transform: scale(1.06);
          filter: drop-shadow(0 0 10px ${ACCENT}88);
        }

        .app-header .brand-text {
          color: var(--color-text-main);
          font-size: clamp(11px, 2.2vw, 15px);
          white-space: nowrap;
          transition: color 0.3s ease;
        }
        .app-header .navbar-brand:hover .brand-text {
          color: ${ACCENT};
        }

        @media (min-width: 992px) {
          .app-header .brand-logo {
            margin-left: -25%;
          }
        }
        @media (max-width: 360px) {
          .app-header .brand-text {
            display: none;
          }
        }

        /* Liens de nav - Utilisation de var(--color-text-main) pour changer dynamiquement de couleur */
        .app-header .nav-link {
          position: relative;
          color: var(--color-text-main) !important;
          transition: color 0.25s ease;
        }
        .app-header .nav-link::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 2px;
          width: 0;
          height: 2px;
          background: ${ACCENT};
          transition: width 0.25s ease, left 0.25s ease;
          border-radius: 2px;
        }
        .app-header .nav-link:hover {
          color: ${ACCENT} !important;
        }
        .app-header .nav-link:hover::after,
        .app-header .nav-link.is-active::after {
          width: 70%;
          left: 15%;
        }
        .app-header .nav-link.is-active {
          color: ${ACCENT} !important;
        }

        /* Bouton Theme Toggle */
        .app-header .theme-toggle-btn {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-main);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }
        .app-header .theme-toggle-btn:hover {
          border-color: ${ACCENT};
          color: ${ACCENT};
          transform: scale(1.08);
        }

        .app-header .login-btn {
          transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
        }
        .app-header .login-btn:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 0 18px ${ACCENT}99;
        }

        /* Burger menu mobile */
        .app-header .burger {
          width: 26px;
          height: 20px;
          position: relative;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          display: none;
        }
        .app-header .burger span {
          position: absolute;
          left: 4px;
          right: 4px;
          height: 2px;
          background: var(--color-text-main);
          border-radius: 2px;
          transition: transform 0.3s ease, opacity 0.2s ease, top 0.3s ease;
        }
        .app-header .burger span:nth-child(1) { top: 4px; }
        .app-header .burger span:nth-child(2) { top: 11px; }
        .app-header .burger span:nth-child(3) { top: 18px; }

        .app-header .burger.is-open span:nth-child(1) {
          top: 11px;
          transform: rotate(45deg);
        }
        .app-header .burger.is-open span:nth-child(2) { opacity: 0; }
        .app-header .burger.is-open span:nth-child(3) {
          top: 11px;
          transform: rotate(-45deg);
        }

        .app-header .navbar-collapse { display: none; }
        .app-header .navbar-collapse.is-open {
          display: block;
          animation: navFadeIn 0.28s ease forwards;
        }
        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 992px) {
          .app-header .navbar-collapse { display: flex !important; animation: none !important; }
        }

        @media (max-width: 991.98px) {
          .app-header .burger { display: block; }
          .app-header .navbar-collapse {
            padding: 1rem 0 1.25rem;
            border-top: 1px solid var(--color-border);
            margin-top: 0.75rem;
          }
          .app-header .nav-link { padding: 0.6rem 0.25rem; }
          .app-header .nav-item + .nav-item {
            border-top: 1px solid var(--color-border);
          }
          .app-header .mobile-theme-container {
            border-top: 1px solid var(--color-border);
            padding-top: 0.75rem;
            margin-top: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
        }
      `}</style>

      <nav className={`app-header navbar navbar-expand-lg fixed-top shadow-sm ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container px-3">
          <Link className="navbar-brand" to="/" onClick={closeMenu}>
            <img src={logo} alt="Kakabi Portfolio Logo" className="brand-logo img-fluid" />
            <span className="brand-text">PORTFOLIO</span>
          </Link>

          {/* Burger affiché sur mobile uniquement */}
          <div className="d-flex align-items-center">
            <button
              className={`burger ${isOpen ? 'is-open' : ''}`}
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-controls="navbarNav"
              aria-expanded={isOpen}
              aria-label="Toggle navigation"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>

          <div className={`navbar-collapse justify-content-end ${isOpen ? 'is-open' : ''}`} id="navbarNav">
            <ul className="navbar-nav align-items-lg-center gap-lg-2">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <li className="nav-item" key={link.to}>
                    <Link
                      className={`nav-link fw-medium ${isActive ? 'is-active' : ''}`}
                      to={link.to}
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}

              <li className="nav-item ms-lg-3">
                <Link
                  className="login-btn btn btn-sm px-3 py-2 fw-semibold text-dark"
                  to="/login"
                  onClick={closeMenu}
                  style={{ backgroundColor: ACCENT }}
                >
                  Connexion
                </Link>
              </li>

              {/* Bouton Dark/Light mode */}
              <li className="nav-item ms-lg-2 d-flex align-items-center justify-content-lg-center mobile-theme-container">
                <span className="d-lg-none fw-medium" style={{ color: 'var(--color-text-main)' }}>Changer le thème</span>
                <button
                  onClick={toggleTheme}
                  className="theme-toggle-btn"
                  title={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
                  aria-label="Toggle theme"
                >
                  {isDark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}