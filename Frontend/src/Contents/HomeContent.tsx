import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaGithub,
  FaLinkedin,
  FaArrowRight,
  FaArrowDown,
  FaGraduationCap,
  FaAward,
  FaCode,
  FaPalette,
  FaMobileAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { MdImage } from 'react-icons/md';
import { useTheme } from '../Context/ThemeContext';

// Déclaration de type pour contourner l'absence de types officiels dans 'aos'
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { 
  motion, 
  useMotionValue, 
  useTransform, 
  useSpring 
} from 'framer-motion';

import photo from '../assets/Photo.png';
import projectFallback from '../assets/Project1.png';
import { ProjectService } from '../Services/ProjectService';
import type { Project } from '../Models/Project';
import { getStorageUrl } from '../Services/api';

type GeometryKind = 'icosahedron' | 'torus' | 'octahedron';

/* ============================================================
   CONTENU DES NOUVELLES SECTIONS
   Modifie librement ces textes pour qu'ils collent à ta réalité.
   ============================================================ */


const WHAT_I_DO = [
  {
    icon: FaCode,
    title: 'Développement web full-stack',
    text: "Des applications web complètes avec Laravel et React : interface, API et base de données, pensées pour être robustes et faciles à faire évoluer."
  },
  {
    icon: FaMobileAlt,
    title: 'Applications mobiles',
    text: "Conception et développement d'applications mobiles."
  },
  {
    icon: FaPalette,
    title: 'Design UI/UX',
    text: "Des maquettes Figma et des parcours utilisateur clairs, pour des interfaces ergonomiques, fluides et agréables à utiliser."
  }
];

const STACK = [
  'Laravel',
  'PHP',
  'React',
  'TypeScript',
  'Vite',
  'Figma',
  'Three.js',
  'Framer Motion',
  'Bootstrap'
];

/* ============================================================
   HOOKS UTILITAIRES POUR LE FOND 3D
   ============================================================ */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

function useMousePosition() {
  const pos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      pos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pos.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  return pos;
}

function useScrollDepth() {
  const depth = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      depth.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return depth;
}

/* ============================================================
   FOND 3D — Scène immersive interactive (identique à SkillsContent)
   L'accent est calculé en JS car WebGL/Three.js ne peut pas lire
   les variables CSS directement (pas de var(--color-primary) possible
   dans un attribut `color` de matériau Three.js).
   ============================================================ */
function FloatingShape({
  position,
  geometry,
  speed,
  color
}: {
  position: [number, number, number];
  geometry: GeometryKind;
  speed: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const current = useRef(new THREE.Color(color));
  const target = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    mesh.rotation.x = t * speed * 0.3;
    mesh.rotation.y = t * speed * 0.5;
    mesh.position.y = position[1] + Math.sin(t * speed) * 0.4;
    current.current.lerp(target, 0.03);
    (mesh.material as THREE.MeshBasicMaterial).color.copy(current.current);
  });

  return (
    <mesh ref={meshRef} position={position}>
      {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
      {geometry === 'torus' && <torusGeometry args={[0.8, 0.28, 16, 100]} />}
      {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
      <meshBasicMaterial color={color} wireframe transparent opacity={0.32} />
    </mesh>
  );
}

function SkillCore({ accent }: { accent: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const current = useRef(new THREE.Color(accent));
  const target = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    mesh.scale.setScalar(1 + Math.sin(t * 0.6) * 0.06);
    mesh.rotation.y = t * 0.15;
    mesh.rotation.x = t * 0.08;
    current.current.lerp(target, 0.03);
    (mesh.material as THREE.MeshBasicMaterial).color.copy(current.current);
  });

  return (
    <mesh ref={ref} position={[0, 0, -1.5]}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshBasicMaterial color={accent} wireframe transparent opacity={0.16} />
    </mesh>
  );
}

function ConnectionLines({ points, accent }: { points: [number, number, number][]; accent: string }) {
  const segments = useMemo(
    () => points.map((p) => [p, [0, 0, -1.5] as [number, number, number]] as [[number, number, number], [number, number, number]]),
    [points]
  );
  return (
    <>
      {segments.map((seg, i) => (
        <Line key={i} points={seg} color={accent} transparent opacity={0.14} lineWidth={1} />
      ))}
    </>
  );
}

function Particles({ count, accent }: { count: number; accent: string }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 4;
    }
    return arr;
  }, [count]);
  const ref = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={accent} size={0.03} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function SceneRig({
  children,
  mouse,
  scroll
}: {
  children: React.ReactNode;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  scroll: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += (mouse.current.x * 0.15 - group.rotation.y) * 0.02;
    group.rotation.x += (-mouse.current.y * 0.1 - group.rotation.x) * 0.02;
    const targetZ = 8 - scroll.current * 1.4;
    camera.position.z += (targetZ - camera.position.z) * 0.03;
  });

  return <group ref={groupRef}>{children}</group>;
}

function HomeBackground3D({ accent, isDark }: { accent: string; isDark: boolean }) {
  const isMobile = useIsMobile();
  const mouse = useMousePosition();
  const scroll = useScrollDepth();

  const shapePositions = useMemo<[number, number, number][]>(
    () => [
      [-4, 1.5, -2],
      [4.5, -1, -3],
      [2.5, 2.5, -4],
      [-3.5, -2, -3]
    ],
    []
  );
  const visibleShapes = isMobile ? shapePositions.slice(0, 2) : shapePositions;
  const geometries: GeometryKind[] = ['icosahedron', 'torus', 'octahedron'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={isMobile ? [1, 1] : [1, 1.5]}>
        <SceneRig mouse={mouse} scroll={scroll}>
          <SkillCore accent={accent} />
          {/* Moins de particules en light mode : elles sont plus visibles/denses sur fond clair */}
          <Particles count={isMobile ? 50 : isDark ? 140 : 90} accent={accent} />
          {visibleShapes.map((pos, i) => (
            <FloatingShape
              key={i}
              position={pos}
              geometry={geometries[i % geometries.length]}
              speed={0.4 + i * 0.12}
              color={accent}
            />
          ))}
          {!isMobile && <ConnectionLines points={visibleShapes} accent={accent} />}
        </SceneRig>
      </Canvas>
    </div>
  );
}

/* ============================================================
   CARTE PHOTO AVEC EFFET TILT 3D INTERACTIF (Framer Motion)
   ============================================================ */
function PhotoTiltCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), {
    stiffness: 200,
    damping: 20
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 200,
    damping: 20
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 900,
        display: 'inline-block'
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   TITRE DE SECTION RÉUTILISABLE
   ============================================================ */
function SectionTitle({
  before,
  highlight,
  subtitle,
  accent
}: {
  before: string;
  highlight: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="text-center mb-5" data-aos="fade-up">
      <h3 className="fw-bold display-6 mb-2" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>
        {before} <span style={{ color: accent }}>{highlight}</span>
      </h3>
      <p className="mb-0 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '620px', fontSize: '0.95rem' }}>
        {subtitle}
      </p>
    </div>
  );
}

/* ============================================================
   SECTIONS SOUS LA PRÉSENTATION
   Composant mémorisé : il ne se re-rend pas à chaque lettre de
   l'effet machine à écrire du haut de page.
   ============================================================ */
const HomeSections = React.memo(function HomeSections({ isDark }: { isDark: boolean }) {
  const ACCENT = isDark ? '#38bdf8' : '#0284c7';
  const GREEN = isDark ? '#22c55e' : '#15803d';

  const cardBg = 'var(--color-surface)';
  const cardBorder = '1px solid var(--color-border)';
  const cardShadow = isDark
    ? '0 10px 30px rgba(0, 0, 0, 0.35)'
    : '0 10px 26px rgba(15, 23, 42, 0.1)';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await ProjectService.getAll();
        const data = response.data || response;
        const list: Project[] = Array.isArray(data) ? data : (data.data || []);
        // Les projets "mis en avant" passent en premier, on garde les 3 premiers
        const sorted = [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
        setProjects(sorted.slice(0, 3));
      } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  // Les cartes de projets apparaissent après le chargement : on relance AOS
  useEffect(() => {
    if (!loadingProjects) AOS.refresh();
  }, [loadingProjects]);

  return (
    <div id="home-sections" className="position-relative" style={{ zIndex: 1 }}>
      <div className="container pb-5">

       
        {/* Ce que je fais */}
        <div className="py-5">
          <SectionTitle
            before="Ce que"
            highlight="je fais"
            subtitle="Trois domaines dans lesquels je peux vous accompagner, de la conception à la mise en ligne."
            accent={ACCENT}
          />
          <div className="row g-4">
            {WHAT_I_DO.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="col-12 col-md-4" data-aos="fade-up" data-aos-delay={100 + i * 100}>
                  <div
                    className="p-4 p-lg-5 rounded-4 h-100"
                    style={{ backgroundColor: cardBg, border: cardBorder, boxShadow: cardShadow }}
                  >
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ width: '56px', height: '56px', backgroundColor: 'var(--color-surface-2)', color: i === 1 ? GREEN : ACCENT, border: `1px solid ${(i === 1 ? GREEN : ACCENT)}55` }}
                    >
                      <Icon size={26} />
                    </div>
                    <h5 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)' }}>{item.title}</h5>
                    <p className="small mb-0" style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

       

        {/* Projets à la une */}
        <div className="py-5">
          <SectionTitle
            before="Projets"
            highlight="à la une"
            subtitle="Un aperçu de mes réalisations récentes, avec le code source et une démo quand elle est disponible."
            accent={ACCENT}
          />

          {loadingProjects ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status" style={{ width: '2.5rem', height: '2.5rem', color: ACCENT }}></div>
            </div>
          ) : projects.length === 0 ? (
            <p className="text-center mb-0" style={{ color: 'var(--color-text-muted)' }}>
              Mes projets arrivent bientôt.
            </p>
          ) : (
            <div className="row g-4">
              {projects.map((project, i) => (
                <div key={project.id} className="col-12 col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={100 + i * 100}>
                  <div
                    className="h-100 rounded-4 overflow-hidden d-flex flex-column"
                    style={{ backgroundColor: cardBg, border: cardBorder, boxShadow: cardShadow }}
                  >
                    <div style={{ width: '100%', height: '180px', overflow: 'hidden', backgroundColor: isDark ? '#0b1224' : 'var(--color-surface-2)' }}>
                      {project.image_url ? (
                        <img
                          src={getStorageUrl(project.image_url as string)}
                          alt={project.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <img
                          src={projectFallback}
                          alt={project.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <div className="p-4 d-flex flex-column flex-grow-1">
                      <h5 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)' }}>{project.title}</h5>
                      <p
                        className="small mb-3"
                        style={{
                          color: 'var(--color-text-muted)',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {project.description}
                      </p>
                      <div className="d-flex gap-2 mt-auto">
                        {project.github_url && (
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                            style={{ backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-main)', borderRadius: '10px', border: '1px solid var(--color-border)' }}
                          >
                            <FaGithub /> Code
                          </a>
                        )}
                        {project.demo_url && (
                          <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                            style={{ backgroundColor: ACCENT, color: isDark ? '#020617' : '#ffffff', borderRadius: '10px', border: 'none' }}
                          >
                            <FaExternalLinkAlt size={12} /> Démo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-5" data-aos="fade-up">
            <Link
              to="/project"
              className="btn px-4 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-2"
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-main)', border: '2px solid var(--color-border)' }}
            >
              Voir tous mes projets <FaArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Appel à l'action final */}
        <div
          className="text-center rounded-4 p-4 p-lg-5 mt-4 mx-auto"
          style={{ backgroundColor: cardBg, border: `1px solid ${ACCENT}55`, boxShadow: cardShadow, maxWidth: '860px' }}
          data-aos="zoom-in"
        >
          <h3 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.3px' }}>
            Un projet, une idée ou une <span style={{ color: ACCENT }}>opportunité de stage</span> ?
          </h3>
          <p className="small mb-4 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '560px', lineHeight: 1.7 }}>
            Écrivez-moi quelques lignes sur ce que vous avez en tête. Je réponds à chaque message et je reviens vers vous rapidement.
          </p>
          <Link
            to="/contact"
            className="btn px-4 py-3 rounded-pill fw-bold d-inline-flex align-items-center gap-2 shadow-lg"
            style={{ backgroundColor: ACCENT, color: isDark ? '#020617' : '#ffffff', border: 'none' }}
          >
            Me contacter <FaArrowRight />
          </Link>
        </div>

      </div>
    </div>
  );
});

export default function HomeContent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Accent Three.js recalculé en JS selon le thème (WebGL ne lit pas les CSS vars)
  const sceneAccent = isDark ? '#60a5fa' : '#2563eb';

  // États pour l'effet de frappe dynamique (sur la profession / rôles)
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentSubText, setCurrentSubText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const roles = [
    "Étudiant en Informatique",
    "Développeur Full-Stack",
    // "Software Engineer"
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

  // Défilement fluide vers les sections sous la présentation
  const scrollToSections = () => {
    document.getElementById('home-sections')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Animations CSS injectées pour le curseur clignotant et l'indicateur de défilement */}
      <style>{`
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
        .scroll-hint {
          animation: scrollBounce 1.8s infinite;
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 8px); }
        }
      `}</style>

      <div
        className="home-page-wrapper position-relative"
        style={{
          backgroundColor: isDark ? '#020617' : 'var(--color-bg)',
          overflow: 'hidden',
          transition: 'background-color 0.3s ease'
        }}
      >
        
        {/* Fond 3D interactif amélioré (identique à skillscontent) */}
        <HomeBackground3D accent={sceneAccent} isDark={isDark} />

        {/* Section d'accueil (présentation) */}
        <div
          className="d-flex align-items-center position-relative"
          style={{ minHeight: '100vh', paddingTop: '80px', zIndex: 1 }}
        >
          <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
            <div className="row align-items-center g-5">
              
              {/* Colonne de gauche : Texte et Présentation */}
              <div className="col-lg-7" data-aos="fade-right">
                <div className="mb-3">
                  
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
                    style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', border: 'none' }}
                  >
                    Explorer mes projets <FaArrowRight />
                  </Link>
                  
                  <Link 
                    to="/contact" 
                    className="btn px-4 py-3 rounded-pill fw-bold d-flex align-items-center gap-2"
                    style={{ backgroundColor: 'transparent', color: 'var(--color-text-main)', border: '2px solid var(--color-border)' }}
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
                    style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                    title="GitHub"
                  >
                    <FaGithub size={20} />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/christian-kakabi-025373374" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                    title="LinkedIn"
                  >
                    <FaLinkedin size={20} />
                  </a>
                </div>

              </div>

              {/* Colonne de droite : Photo de profil avec effet 3D Tilt interactif & fond lumineux */}
              <div className="col-lg-5 text-center" data-aos="zoom-in" data-aos-delay="300">
                <div className="position-relative d-inline-block">
                  
                  {/* Effet d'arrière-plan lumineux : intensité réduite en light mode pour éviter le halo trop visible sur fond clair */}
                  <div 
                    className="position-absolute top-50 start-50 translate-middle rounded-circle"
                    style={{ 
                      width: '320px', 
                      height: '320px', 
                      background: isDark
                        ? 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(34, 197, 94, 0.05) 70%)'
                        : 'radial-gradient(circle, rgba(2, 132, 199, 0.14) 0%, rgba(21, 128, 61, 0.04) 70%)',
                      zIndex: 0,
                      filter: 'blur(25px)'
                    }}
                  ></div>
                  
                  {/* Carte photo encapsulée dans le composant de Tilt 3D */}
                  <PhotoTiltCard>
                    <div 
                      className="p-3 rounded-4 position-relative shadow-2xl" 
                      style={{ 
                        backgroundColor: 'var(--color-surface)', 
                        border: '1px solid var(--color-border)',
                        zIndex: 1,
                        maxWidth: '360px',
                        margin: '0 auto',
                        transition: 'background-color 0.3s ease, border-color 0.3s ease'
                      }}
                    >
                      <img 
                        src={photo} 
                        alt="Talla Kouetche Kakabi Christian" 
                        className="img-fluid rounded-3"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </PhotoTiltCard>

                </div>
              </div>

            </div>
          </div>

          {/* Indicateur de défilement vers les sections suivantes */}
          <button
            type="button"
            onClick={scrollToSections}
            className="scroll-hint position-absolute btn rounded-circle d-flex align-items-center justify-content-center shadow-sm"
            style={{
              bottom: '24px',
              left: '50%',
              width: '44px',
              height: '44px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
              zIndex: 2
            }}
            title="Découvrir la suite"
            aria-label="Découvrir la suite"
          >
            <FaArrowDown size={16} />
          </button>
        </div>

        {/* Nouvelles sections sous la présentation */}
        <HomeSections isDark={isDark} />

      </div>
    </>
  );
}