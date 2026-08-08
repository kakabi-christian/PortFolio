import { Link } from 'react-router-dom';
import logo from '../assets/Logo-app.png'; 

export default function Header() {
  return (
    <nav className="navbar navbar-expand-lg fixed-top shadow-sm" style={{ backgroundColor: '#1e293b' }}>
      <div className="container">
        {/* Remplacement du texte par le Logo */}
        <Link className="navbar-brand d-flex align-items-center p-0" to="/">
          <img 
            src={logo} 
            alt="Kakabi Portfolio Logo" 
            style={{ height: '70px', width: '250px', marginLeft:'-40%' }} // Ajuste la hauteur selon ton logo
            className="img-fluid"
            
          />
          <span style={{ color:'white', fontSize:'20px' }}> PORTFOLIO</span>
        </Link>

        {/* Bouton Hamburger pour mobile */}
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        {/* Liens de navigation alignés */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-lg-center gap-2">
            <li className="nav-item">
              <Link className="nav-link text-light fw-medium" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-light fw-medium" to="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-light fw-medium" to="/skills">Skills</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-light fw-medium" to="/project">Project</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-light fw-medium" to="/contact">Contact</Link>
            </li>
            <li className="nav-item ms-lg-3">
              <Link 
                className="btn btn-sm px-3 py-2 fw-semibold text-dark" 
                to="/login" 
                style={{ backgroundColor: '#38bdf8', transition: '0.3s' }}
              >
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}