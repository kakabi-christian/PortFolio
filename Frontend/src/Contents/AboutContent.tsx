import React, { useEffect } from 'react';
import { FaGraduationCap, FaBriefcase, FaUserCheck, FaMapMarkerAlt, FaTools } from 'react-icons/fa';

// Déclaration de type pour contourner l'absence de types officiels dans 'aos'
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AboutContent() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });
  }, []);

  return (
    <section className="py-5 text-light" style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
      <div className="container py-4">
        
        {/* En-tête de la page */}
        <div className="text-center mb-5" data-aos="fade-up">
          <h2 className="fw-bold display-6 mb-2" style={{ color: '#f8fafc', paddingTop: '40px' }}>
            À propos de <span style={{ color: '#38bdf8' }}>moi</span>
          </h2>
          <div className="mx-auto mb-3" style={{ width: '60px', height: '4px', backgroundColor: '#22c55e', borderRadius: '2px' }}></div>
          <p className="text-light lead fs-6 mx-auto" style={{ maxWidth: '700px' }}>
            Découvrez mon parcours, mes compétences et ma passion pour la création d'applications innovantes.
          </p>
        </div>

        {/* Section 1 : Profil et Informations */}
        <div className="row g-4 mb-5">
          <div className="col-12" data-aos="fade-right" data-aos-delay="100">
            <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <h3 className="fw-bold fs-5 mb-3 d-flex align-items-center gap-2" style={{ color: '#38bdf8' }}>
                <FaUserCheck /> Profil & Vision
              </h3>
              <p className="text-light small lh-lg mb-3">
                Je m'appelle <strong style={{ color: '#f8fafc' }}>Talla Kouetche Kakabi Christian</strong>, étudiant en niveau 3 en informatique (Concepteur et Développeur web Full-stack) à l’<strong style={{ color: '#22c55e' }}>Institut Universitaire de la Côte (IUC)</strong> de Logbessou (Douala), passionné par le numérique et la création d'applications innovantes.
              </p>
              <p className="text-light small lh-lg mb-3">
                Fasciné par la manière dont la technologie transforme les idées en solutions concrètes, je m’investis pleinement dans mes projets. Curieux et motivé, je considère chaque défi comme une occasion d’apprendre et de me dépasser.
              </p>
              <div className="d-flex align-items-center gap-2 text-light small">
                <FaMapMarkerAlt style={{ color: '#ef4444' }} />
                <span>Village-Elf / Akwa, Douala — Cameroun | +237 658 78 84 48</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 : Parcours Académique Détaillé */}
        <div className="mb-5" data-aos="fade-up" data-aos-delay="200">
          <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="fw-bold fs-5 mb-4 d-flex align-items-center gap-2" style={{ color: '#22c55e' }}>
              <FaGraduationCap /> Parcours Académique
            </h3>
            
            <div className="row g-4">
              {/* Étape 3 */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="300">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <span className="badge bg-secondary mb-2">2023 – 2024 (Première année – Reprise)</span>
                  <h4 className="fw-bold fs-6 text-light mb-1">Institut Universitaire de la Côte (IUC)</h4>
                  <p className="text-success small mb-2 fw-semibold">Logbessou, Douala — Technologie de l'Informatique (TI)</p>
                  <p className="text-light small mb-0">
                    Réorientation réussie vers le numérique. Moyenne annuelle obtenue : 13,24/20.
                  </p>
                </div>
              </div>

              {/* Étape 4 */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="400">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <span className="badge bg-secondary mb-2">2024 – 2025 (Deuxième année)</span>
                  <h4 className="fw-bold fs-6 text-light mb-1">IUC — Programmation et Développement d’Applications Mobiles (PAM)</h4>
                  <p className="text-success small mb-2 fw-semibold">Logbessou, Douala</p>
                  <p className="text-light small mb-0">
                    Moyenne annuelle de 15,19/20. Obtention du <strong>Diplôme d’Études Collégiales (DEC)</strong> attestant de compétences avancées en programmation et technologies mobiles.
                  </p>
                </div>
              </div>

              {/* Étape 5 */}
              <div className="col-12" data-aos="fade-up" data-aos-delay="500">
                <div className="p-3 rounded-3" style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8' }}>
                  <span className="badge bg-info text-dark mb-2">2025 – 2026 (Troisième année – En cours)</span>
                  <h4 className="fw-bold fs-6 text-light mb-1">IUC — Concepteur Développeur Web Full-Stack (CDWFS)</h4>
                  <p className="text-info small mb-2 fw-semibold">Logbessou, Douala</p>
                  <p className="text-light small mb-0">
                    Renforcement des compétences en développement web avancé, conception d'applications complètes (frontend & backend) et technologies modernes du numérique.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3 : Expérience Professionnelle (Stage Levegi) */}
        <div className="row justify-content-center mb-5" data-aos="fade-up" data-aos-delay="600">
          <div className="col-12">
            <div className="p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <h3 className="fw-bold fs-5 mb-4 d-flex align-items-center gap-2" style={{ color: '#eab308' }}>
                <FaBriefcase /> Expérience Professionnelle
              </h3>
              <div className="p-3 rounded-3" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                  <h4 className="fw-bold fs-6 text-light mb-0">Stage Académique – LEVEGI</h4>
                  <span className="badge bg-warning text-dark small fw-semibold">09 Juin 2025 au 24 Juillet 2025</span>
                </div>
                <p className="text-muted small mb-2"><FaMapMarkerAlt className="me-1 text-danger" /> Akwa, Douala</p>
                <p className="text-light small mb-3">
                  Stage académique de deux mois effectué en vue de l'obtention du DEC. Supervision technique assurée par <strong style={{ color: '#f8fafc' }}>M. PAGOUEN KAWE Ragil</strong>.
                </p>
                <div className="d-flex flex-wrap gap-2 text-light small">
                  <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>Programmation Application Mobile (PAM)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}