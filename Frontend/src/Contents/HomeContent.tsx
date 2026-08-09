import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaArrowRight } from 'react-icons/fa';

// Déclaration de type pour contourner l'absence de types officiels dans 'aos'
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import photo from '../assets/Photo.png';

export default function HomeContent() {
  // États pour l'effet de frappe dynamique (sur la profession / rôles)
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentSubText, setCurrentSubText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const roles = [
    "Étudiant en Informatique",
    "Développeur Full-Stack",
    "Software Engineer"
  ];

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });
  }, []);

  // Logique de l'effet d'écriture / effacement automatique
  useEffect(() => {
    const fullText = roles[currentTextIndex];

    const handleTyping = () => {
      if (!isDeleting) {
        // Mode écriture
        setCurrentSubText(fullText.substring(0, currentSubText.length + 1));
        if (currentSubText === fullText) {
          // Pause avant d'effacer
          setTimeout(() => setIsDeleting(true), 2000);
          setTypingSpeed(100);
        }
      } else {
        // Mode effacement
        setCurrentSubText(fullText.substring(0, currentSubText.length - 1));
        if (currentSubText === '') {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % roles.length);
          setTypingSpeed(150);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentSubText, isDeleting, currentTextIndex, typingSpeed, roles]);

  return (
    <>
      {/* Animations CSS injectées pour le flottement et le curseur clignotant */}
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
        .cursor-blink {
          display: inline-block;
          background-color: var(--color-success);
          width: 3px;
          animation: blink 0.8s infinite;
          margin-left: 4px;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div className="home-page-wrapper d-flex align-items-center" style={{ minHeight: '100vh', paddingTop: '80px', backgroundColor: 'var(--color-bg)' }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            
            {/* Colonne de gauche : Texte et Présentation */}
            <div className="col-lg-7" data-aos="fade-right">
              <div className="mb-3">
                <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-primary)' }}>
                  👋 Bienvenue sur mon portfolio
                </span>
              </div>
              
              {/* Le nom s'affiche d'abord en haut (statique) */}
              <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--color-text-main)' }}>
                Salut, je suis <span style={{ color: 'var(--color-primary)' }}>Kakabi Christian</span>
              </h1>
              
              {/* Texte dynamique avec effet machine à écrire pour la profession */}
              <h2 className="h4 fw-semibold mb-4" style={{ color: 'var(--color-text-muted)', minHeight: '35px' }}>
                <span>{currentSubText}</span>
                <span className="cursor-blink" style={{ height: '24px', verticalAlign: 'middle' }}>&nbsp;</span>
              </h2>
              
              <p className="lead mb-4" style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: '1.7' }}>
                Passionné par la conception et le développement d'applications web performantes. 
                Je transforme vos idées en solutions numériques robustes, de l'interface utilisateur jusqu'à l'infrastructure cloud.
              </p>

              {/* Boutons d'action */}
              <div className="d-flex flex-wrap gap-3 mb-4" data-aos="fade-up" data-aos-delay="200">
                <Link 
                  to="/project" 
                  className="btn px-4 py-3 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-lg"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none' }}
                >
                  Explorer mes projets <FaArrowRight />
                </Link>
                
                <Link 
                  to="/contact" 
                  className="btn px-4 py-3 rounded-pill fw-bold d-flex align-items-center gap-2"
                  style={{ backgroundColor: 'transparent', color: 'var(--color-text-main)', border: `2px solid var(--color-border)` }}
                >
                  Me contacter
                </Link>
              </div>

              {/* Réseaux Sociaux Professionnels */}
              <div className="d-flex align-items-center gap-3 pt-3" data-aos="fade-up" data-aos-delay="400">
                <span className="small fw-semibold" style={{ color: 'var(--color-text-muted)' }}>Retrouvez-moi sur :</span>
                <a 
                  href="https://github.com/kakabi-christian" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: `1px solid var(--color-border)` }}
                  title="GitHub"
                >
                  <FaGithub size={20} />
                </a>
                <a 
                  href="https://www.linkedin.com/in/christian-kakabi-025373374" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: `1px solid var(--color-border)` }}
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
                    backgroundColor: 'var(--color-surface)', 
                    border: `1px solid var(--color-border)`,
                    zIndex: 1,
                    maxWidth: '360px',
                    margin: '0 auto'
                  }}
                >
                  <img 
                    src={photo} 
                    alt="Talla Kouetche Kakabi Christian" 
                    className="img-fluid"
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