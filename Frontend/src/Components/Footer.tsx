import { useEffect } from 'react';
import { FaGithub, FaLinkedin, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

// Déclaration de type pour contourner l'absence de types officiels dans 'aos'
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import logo from '../assets/Logo-app.png';

export default function Footer() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });
  }, []);

  return (
    <footer className="pt-4 pb-3 text-light" style={{ backgroundColor: '#1e293b', borderTop: '1px solid #334155' }}>
      <div className="container">
        <div className="row g-4 justify-content-between align-items-center text-center text-md-start">
          
          {/* Colonne 1 : Logo */}
          <div className="col-lg-4 col-md-6 d-flex justify-content-center justify-content-md-start" data-aos="fade-up" data-aos-delay="100">
            <div className="d-flex align-items-center">
              <img 
                src={logo} 
                alt="Kakabi Portfolio Logo" 
                style={{ height: '45px', width: 'auto', objectFit: 'contain' }} 
                className="img-fluid me-2"
              />
              <span className="fw-bold fs-5" style={{ color: '#f8fafc' }}>PORTFOLIO</span>
            </div>
          </div>

          {/* Colonne 2 : Contact Direct */}
          <div className="col-lg-4 col-md-6 d-flex flex-column align-items-center align-items-md-start" data-aos="fade-up" data-aos-delay="300">
            <h5 className="text-light fw-bold mb-2 fs-6" style={{ borderLeft: '3px solid #22c55e', paddingLeft: '10px' }}>
              Contact Direct
            </h5>
            <div className="d-flex flex-column gap-2 align-items-center align-items-md-start">
              <div className="d-flex align-items-center gap-2 text-light small">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                  <FaWhatsapp size={13} />
                </div>
                <span>+237 658 78 84 48</span>
              </div>
              
              <div className="d-flex align-items-center gap-2 text-light small">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <FaEnvelope size={11} />
                </div>
                <span style={{ fontSize: '0.85rem' }}>kakabichristian@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Colonne 3 : Réseaux (Compact) */}
          <div className="col-lg-3 col-md-6 d-flex flex-column align-items-center align-items-md-start" data-aos="fade-up" data-aos-delay="400">
            <h5 className="text-light fw-bold mb-2 fs-6" style={{ borderLeft: '3px solid #38bdf8', paddingLeft: '10px' }}>
              Réseaux
            </h5>
            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              <a 
                href="https://github.com/kakabi-christian" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }}
                title="GitHub"
              >
                <FaGithub size={16} />
              </a>
              <a 
                href="https://www.linkedin.com/in/christian-kakabi-025373374" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }}
                title="LinkedIn"
              >
                <FaLinkedin size={16} />
              </a>
              <a 
                href="https://wa.me/237658788448" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', backgroundColor: '#0f172a', color: '#22c55e', border: '1px solid #334155' }}
                title="WhatsApp"
              >
                <FaWhatsapp size={16} />
              </a>
            </div>
          </div>

        </div>

        {/* Ligne de séparation et Copyright */}
        <hr className="my-3" style={{ borderColor: '#334155' }} />
        <div className="text-center">
          <p className="text-light small mb-0">
            &copy; {new Date().getFullYear()} <span style={{ color: '#38bdf8' }}>Kakabi Christian</span>. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}