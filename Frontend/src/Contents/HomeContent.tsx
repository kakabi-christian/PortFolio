import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaArrowRight } from 'react-icons/fa';

// Déclaration de type pour contourner l'absence de types officiels dans 'aos'
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import photo from '../assets/Photo.png';

export default function HomeContent() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });
  }, []);

  return (
    <>
      {/* Animation CSS injectée pour faire pivoter/incliner subtilement la carte de profil */}
      <style>{`
        @keyframes floatAndTilt {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(2deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        .animate-tilt-float {
          animation: floatAndTilt 6s ease-in-out infinite;
        }
      `}</style>

      <div className="home-page-wrapper d-flex align-items-center" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            
            {/* Colonne de gauche : Texte et Présentation */}
            <div className="col-lg-7" data-aos="fade-right">
              <div className="mb-3">
                <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                  👋 Bienvenue sur mon portfolio
                </span>
              </div>
              
              <h1 className="display-4 fw-bold mb-3" style={{ color: '#f8fafc' }}>
                Salut, je suis <span style={{ color: '#38bdf8' }}>Kakabi Christian</span>
              </h1>
              
              <h2 className="h4 fw-semibold mb-4" style={{ color: '#94a3b8' }}>
                Étudiant en Informatique & Développeur <span style={{ color: '#22c55e' }}>Full-Stack</span> (Software Engineer)
              </h2>
              
              <p className="lead mb-4" style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.7' }}>
                Passionné par la conception et le développement d'applications web et mobiles performantes. 
                Je transforme vos idées en solutions numériques robustes, de l'interface utilisateur jusqu'à l'infrastructure cloud.
              </p>

              {/* Boutons d'action */}
              <div className="d-flex flex-wrap gap-3 mb-4" data-aos="fade-up" data-aos-delay="200">
                <Link 
                  to="/project" 
                  className="btn px-4 py-3 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-lg"
                  style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none' }}
                >
                  Explorer mes projets <FaArrowRight />
                </Link>
                
                <Link 
                  to="/contact" 
                  className="btn px-4 py-3 rounded-pill fw-bold d-flex align-items-center gap-2"
                  style={{ backgroundColor: 'transparent', color: '#f8fafc', border: '2px solid #334155' }}
                >
                  Me contacter
                </Link>
              </div>

              {/* Réseaux Sociaux Professionnels */}
              <div className="d-flex align-items-center gap-3 pt-3" data-aos="fade-up" data-aos-delay="400">
                <span className="small fw-semibold" style={{ color: '#94a3b8' }}>Retrouvez-moi sur :</span>
                <a 
                  href="https://github.com/kakabi-christian" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '40px', height: '40px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155' }}
                  title="GitHub"
                >
                  <FaGithub size={20} />
                </a>
                <a 
                  href="https://www.linkedin.com/in/christian-kakabi-025373374" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '40px', height: '40px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155' }}
                  title="LinkedIn"
                >
                  <FaLinkedin size={20} />
                </a>
              </div>

            </div>

            {/* Colonne de droite : Photo de profil stylisée et animée */}
            <div className="col-lg-5 text-center" data-aos="zoom-in" data-aos-delay="300">
              <div className="position-relative d-inline-block">
                
                {/* Effet d'arrière-plan lumineux */}
                <div 
                  className="position-absolute top-50 start-50 translate-middle rounded-circle"
                  style={{ 
                    width: '320px', 
                    height: '320px', 
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(34, 197, 94, 0.05) 70%)',
                    zIndex: 0,
                    filter: 'blur(20px)'
                  }}
                ></div>
                
                {/* Carte contenant l'image avec l'animation de rotation/flottement */}
                <div 
                  className="p-3 rounded-4 position-relative shadow-2xl animate-tilt-float" 
                  style={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    zIndex: 1,
                    maxWidth: '360px',
                    margin: '0 auto'
                  }}
                >
                  <img 
                    src={photo} 
                    alt="Talla Kouetche Kakabi Christian" 
                    className="img-fluid  "
                    style={{ width: '100%' }}
                  />
                  
                 
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}