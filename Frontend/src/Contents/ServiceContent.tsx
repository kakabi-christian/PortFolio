import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import {
  MdSearch,
  MdImage,
  MdMiscellaneousServices,
  MdRocket,
  MdForum,
  MdDescription,
  MdCode,
  MdLocalShipping,
  MdDevices,
  MdVerified,
  MdSupportAgent,
  MdExpandMore,
  MdExpandLess
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

import { serviceApi } from '../Services/Service';
import type { Service } from '../Models/Service';
import photo from '../assets/ServiceImg.png';
import { getStorageUrl } from '../Services/api';
import { useTheme } from '../Context/ThemeContext';

// Photo d'en-tête (carte tilt à droite) et image de secours pour un service sans image.
// Remplace-la par une image dédiée aux services quand tu en auras une.
const headerPhoto = photo;

type GeometryKind = 'icosahedron' | 'torus' | 'octahedron';

/* ============================================================
   CONTENU EXPLICATIF (étapes, atouts, questions fréquentes)
   Modifie librement ces textes pour qu'ils collent à ta réalité.
   ============================================================ */
const PROCESS_STEPS = [
  {
    icon: MdForum,
    title: 'Échange',
    text: "Vous me présentez votre idée, vos objectifs et vos contraintes via le formulaire de contact. On clarifie ensemble ce dont vous avez réellement besoin."
  },
  {
    icon: MdDescription,
    title: 'Proposition',
    text: "Je vous envoie une proposition claire : ce qui sera réalisé et la façon dont nous allons procéder, pour que vous sachiez exactement à quoi vous attendre."
  },
  {
    icon: MdCode,
    title: 'Développement',
    text: "Je conçois et je développe votre solution, de l'interface au serveur. Vous êtes tenu au courant de l'avancement pour valider chaque étape."
  },
  {
    icon: MdLocalShipping,
    title: 'Livraison',
    text: "Je mets votre projet en ligne et je vous le présente. Nous faisons ensemble les derniers ajustements avant la remise finale."
  }
];

const STRENGTHS = [
  {
    icon: MdDevices,
    title: 'Solution complète',
    text: "Interface, serveur et base de données : je m'occupe de tout, vous n'avez qu'un seul interlocuteur."
  },
  {
    icon: MdVerified,
    title: 'Technologies modernes',
    text: "Je travaille avec Laravel et React, des outils fiables, très utilisés et faciles à faire évoluer."
  },
  {
    icon: MdSupportAgent,
    title: 'Communication claire',
    text: "Des explications simples, sans jargon inutile, et une réponse à chacun de vos messages."
  }
];

const FAQ_ITEMS = [
  {
    question: "Comment me contacter pour un projet ?",
    answer: "Cliquez sur « Me contacter » sur le service qui vous intéresse, ou rendez-vous sur la page Contact. Décrivez votre projet et vos délais souhaités, et je vous réponds rapidement."
  },
  {
    question: "Mon projet ne correspond à aucun service de la liste, que faire ?",
    answer: "Écrivez-moi quand même. Les services listés sont des exemples de ce que je réalise, et je peux adapter une proposition à un besoin plus précis ou plus particulier."
  },
  {
    question: "Puis-je voir des exemples de réalisations ?",
    answer: "Oui, la page Projets présente mes réalisations avec, pour chacune, le code source et une démonstration en ligne quand elle est disponible."
  }
];

/* ============================================================
   HOOKS UTILITAIRES POUR LE FOND 3D UNIFIÉ
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
   FOND 3D — même laboratoire technologique que sur les autres pages
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

  useEffect(() => {
    target.set(color);
  }, [color, target]);

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
      <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
    </mesh>
  );
}

function BackgroundCore({ accent }: { accent: string }) {
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
      <meshBasicMaterial color={accent} wireframe transparent opacity={0.15} />
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

function ServicesBackground3D({ isMobile, accent, isDark }: { isMobile: boolean; accent: string; isDark: boolean }) {
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
          <BackgroundCore accent={accent} />
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
   CARTE PHOTO D'EN-TÊTE AVEC EFFET TILT 3D
   ============================================================ */
function HeaderPhotoTiltCard({ accent, children }: { accent: string; children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });

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
        display: 'inline-block',
        filter: `drop-shadow(0 0 24px ${accent}33)`
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   CARTE SERVICE AVEC EFFET TILT 3D
   ============================================================ */
function ServiceTiltCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 250, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 250, damping: 25 });

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
        height: '100%'
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   CARTE DE SERVICE
   ============================================================ */
function ServiceCard({
  service,
  index,
  accent,
  isDark
}: {
  service: Service;
  index: number;
  accent: string;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const imageSrc = service.image ? getStorageUrl(service.image) : photo;

  const description = service.description || '';
  // Un "voir plus" n'a de sens que si le texte est assez long pour être tronqué
  const isLong = description.length > 120;

  const cardBg = 'var(--color-surface)';
  const cardBorder = '1px solid var(--color-border)';
  const cardShadow = isDark
    ? '0 10px 30px rgba(0, 0, 0, 0.35)'
    : '0 10px 26px rgba(15, 23, 42, 0.1)';

  return (
    <div
      className="col-12 col-md-6 col-lg-4"
      data-aos="fade-up"
      data-aos-delay={100 + (index % 6) * 80}
    >
      <ServiceTiltCard>
        <div
          className="h-100 rounded-4 overflow-hidden position-relative"
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
            transition: 'border-color 0.3s ease'
          }}
        >
          <div style={{ width: '100%', height: '200px', overflow: 'hidden', backgroundColor: isDark ? '#0b1224' : 'var(--color-surface-2)' }}>
            <img
              src={imageSrc}
              alt={service.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div className="p-4 d-flex flex-column" style={{ minHeight: '200px' }}>
            <h5 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)' }}>{service.title}</h5>

            <p
              className="small mb-1"
              lang="fr"
              style={
                expanded
                  ? { color: 'var(--color-text-muted)', textAlign: 'justify', hyphens: 'auto' }
                  : {
                      color: 'var(--color-text-muted)',
                      textAlign: 'justify',
                      hyphens: 'auto',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }
              }
            >
              {description}
            </p>

            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="btn btn-sm p-0 mb-3 align-self-start fw-semibold"
                style={{ color: accent, background: 'none', border: 'none' }}
              >
                {expanded ? 'Voir moins' : 'Voir plus'}
              </button>
            )}
            {!isLong && <div className="mb-3" />}

            <div className="mt-auto pt-2">
              <Link
                to="/contact"
                className="btn btn-sm fw-semibold d-inline-flex align-items-center gap-2"
                style={{
                  backgroundColor: accent,
                  color: isDark ? '#020617' : '#ffffff',
                  borderRadius: '10px',
                  border: 'none'
                }}
              >
                Me contacter <FaArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </ServiceTiltCard>
    </div>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function ServiceContent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Accents recalculés selon le thème (identique à Home / About / Contact / Projects)
  const ACCENT = isDark ? '#38bdf8' : '#0284c7';
  const GREEN = isDark ? '#22c55e' : '#15803d';

  const pageBg = isDark ? '#020617' : 'var(--color-bg)';
  const cardBg = 'var(--color-surface)';
  const cardBorder = '1px solid var(--color-border)';

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

  // Question de la FAQ actuellement ouverte
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const isMobile = useIsMobile();

  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        // Route publique (sans token) pour les visiteurs
        const response = await serviceApi.getAll(currentPage, 6);
        setServices(Array.isArray(response.data) ? response.data : []);
        setLastPage(response.last_page || 1);
      } catch (error) {
        console.error("Erreur lors du chargement des services:", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredServices = services.filter((s) =>
    !searchTerm || (s.title && s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: pageBg, paddingTop: '80px', paddingBottom: '60px', transition: 'background-color 0.3s ease' }}>
      <ServicesBackground3D isMobile={isMobile} accent={ACCENT} isDark={isDark} />

      <div className="container-fluid position-relative py-4 px-4 px-lg-5" style={{ zIndex: 2, color: 'var(--color-text-main)' }}>
        {/* En-tête — texte aligné à gauche, photo à droite */}
        <div className="row align-items-center mb-5 g-4" data-aos="fade-up">
          <div className="col-lg-7 text-start">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3"
              style={{ backgroundColor: cardBg, border: `1px solid ${ACCENT}55` }}
            >
              <MdMiscellaneousServices style={{ color: ACCENT }} />
              <span className="small text-uppercase fw-semibold" style={{ color: ACCENT, letterSpacing: '2px' }}>
                Services
              </span>
            </div>

            <h2 className="fw-bold display-5 mb-3" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>
              Mes <span style={{ color: ACCENT }}>Services</span>
            </h2>
            <p className="lead fs-6 mb-3" style={{ color: 'var(--color-text-muted)', maxWidth: '650px' }}>
              Sites web, applications web et solutions sur mesure : découvrez ce que je peux réaliser pour vous.
            </p>
            <p className="fs-6 mb-4" style={{ color: 'var(--color-text-muted)', maxWidth: '650px' }}>
              Que vous ayez besoin d'une vitrine pour présenter votre activité, d'une application pour gérer vos données ou d'un outil adapté à votre métier, je vous accompagne de l'idée jusqu'à la mise en ligne. Parcourez les services ci-dessous, puis contactez-moi pour en discuter.
            </p>

            <div className="row g-3 mt-2" style={{ maxWidth: '680px' }}>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="100">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: cardBg, border: cardBorder }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdCode style={{ color: ACCENT }} className="fs-5" />
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--color-text-main)' }}>Solutions sur mesure</h6>
                  </div>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                    Chaque projet est pensé selon votre activité, vos besoins et vos objectifs.
                  </p>
                </div>
              </div>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="200">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: cardBg, border: cardBorder }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdRocket style={{ color: GREEN }} className="fs-5" />
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--color-text-main)' }}>Échange personnalisé</h6>
                  </div>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                    Décrivez-moi votre projet et je reviens vers vous avec une proposition adaptée.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5 text-end d-flex justify-content-lg-end justify-content-center" data-aos="fade-left" data-aos-delay="150">
            <div className="position-relative d-inline-block">
              <div
                className="position-absolute top-50 start-50 translate-middle rounded-circle"
                style={{
                  width: '380px',
                  height: '380px',
                  background: isDark
                    ? 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(34,197,94,0.05) 70%)'
                    : 'radial-gradient(circle, rgba(2, 132, 199, 0.14) 0%, rgba(21, 128, 61, 0.04) 70%)',
                  zIndex: 0,
                  filter: 'blur(35px)'
                }}
              ></div>

              <HeaderPhotoTiltCard accent={ACCENT}>
                <div
                  className="p-3 rounded-4 position-relative shadow-2xl"
                  style={{
                    backgroundColor: cardBg,
                    border: cardBorder,
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '460px',
                    overflow: 'hidden',
                    minHeight: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={headerPhoto}
                    alt="Services Visual"
                    className="img-fluid rounded-3"
                    style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover' }}
                  />
                </div>
              </HeaderPhotoTiltCard>
            </div>
          </div>
        </div>

        {/* Comment ça se passe — étapes */}
        <div className="mb-5">
          <div className="text-center mb-4" data-aos="fade-up">
            <h3 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.3px' }}>
              Comment ça <span style={{ color: ACCENT }}>se passe</span> ?
            </h3>
            <p className="small mb-0 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '600px' }}>
              Un déroulement simple en quatre étapes, pour que vous sachiez toujours où en est votre projet.
            </p>
          </div>

          <div className="row g-3">
            {PROCESS_STEPS.map((step, i) => {
              const StepIcon = step.icon;
              return (
                <div key={step.title} className="col-12 col-sm-6 col-lg-3" data-aos="fade-up" data-aos-delay={100 + i * 80}>
                  <div className="p-4 rounded-4 h-100 position-relative" style={{ backgroundColor: cardBg, border: cardBorder }}>
                    <span
                      className="position-absolute fw-bold font-monospace"
                      style={{ top: '14px', right: '18px', fontSize: '1.6rem', color: `${ACCENT}33` }}
                    >
                      0{i + 1}
                    </span>
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                      style={{ width: '44px', height: '44px', backgroundColor: 'var(--color-surface-2)', color: ACCENT, border: `1px solid ${ACCENT}55` }}
                    >
                      <StepIcon size={24} />
                    </div>
                    <h6 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)' }}>{step.title}</h6>
                    <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>{step.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Titre de la liste des services */}
        <div className="text-center mb-4" data-aos="fade-up">
          <h3 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.3px' }}>
            Les services <span style={{ color: ACCENT }}>disponibles</span>
          </h3>
          <p className="small mb-0 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '600px' }}>
            Cliquez sur « Me contacter » sur le service qui vous intéresse pour obtenir une proposition adaptée à votre projet.
          </p>
        </div>

        {/* Recherche */}
        <div className="row justify-content-center mb-5" data-aos="fade-up" data-aos-delay="100">
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="input-group shadow-sm"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1px solid ${ACCENT}55`,
                backgroundColor: cardBg
              }}
            >
              <span className="input-group-text border-0 bg-transparent ps-3" style={{ color: 'var(--color-text-muted)' }}>
                <MdSearch size={22} />
              </span>
              <input
                type="text"
                className="form-control shadow-none border-0 py-3 bg-transparent"
                placeholder="Rechercher un service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}
              />
            </div>
          </div>
        </div>

        {/* Grille de services */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: ACCENT }}></div>
            <p className="mt-3 fw-semibold" style={{ color: 'var(--color-text-main)' }}>Chargement de mes services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div
            className="text-center py-5 card border-0 shadow-sm p-5 mx-auto"
            style={{ borderRadius: '20px', backgroundColor: cardBg, border: cardBorder, maxWidth: '600px' }}
          >
            <MdImage size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
            <h4 className="fw-semibold" style={{ color: 'var(--color-text-main)' }}>Aucun service trouvé.</h4>
          </div>
        ) : (
          <div className="row g-4">
            {filteredServices.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} accent={ACCENT} isDark={isDark} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && lastPage > 1 && (
          <div className="d-flex justify-content-center align-items-center gap-3 mt-5" data-aos="fade-up">
            <button
              className="btn btn-sm px-4 py-2 fw-semibold"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              style={{ backgroundColor: cardBg, color: 'var(--color-text-main)', border: cardBorder, borderRadius: '10px' }}
            >
              Précédent
            </button>
            <span className="small" style={{ color: 'var(--color-text-muted)' }}>
              Page <strong style={{ color: ACCENT }}>{currentPage}</strong> sur <strong>{lastPage}</strong>
            </span>
            <button
              className="btn btn-sm px-4 py-2 fw-semibold"
              disabled={currentPage >= lastPage}
              onClick={() => goToPage(currentPage + 1)}
              style={{ backgroundColor: ACCENT, color: isDark ? '#020617' : '#ffffff', border: 'none', borderRadius: '10px' }}
            >
              Suivant
            </button>
          </div>
        )}

        {/* Pourquoi travailler avec moi */}
        <div className="mt-5 pt-4">
          <div className="text-center mb-4" data-aos="fade-up">
            <h3 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.3px' }}>
              Pourquoi <span style={{ color: ACCENT }}>travailler avec moi</span> ?
            </h3>
            <p className="small mb-0 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '600px' }}>
              Ce que vous pouvez attendre d'une collaboration.
            </p>
          </div>

          <div className="row g-3">
            {STRENGTHS.map((item, i) => {
              const StrengthIcon = item.icon;
              return (
                <div key={item.title} className="col-12 col-md-4" data-aos="fade-up" data-aos-delay={100 + i * 100}>
                  <div className="p-4 rounded-4 h-100 text-center" style={{ backgroundColor: cardBg, border: cardBorder }}>
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ width: '52px', height: '52px', backgroundColor: 'var(--color-surface-2)', color: i === 1 ? GREEN : ACCENT, border: `1px solid ${(i === 1 ? GREEN : ACCENT)}55` }}
                    >
                      <StrengthIcon size={26} />
                    </div>
                    <h6 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)' }}>{item.title}</h6>
                    <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Questions fréquentes */}
        <div className="mt-5 pt-4 mx-auto" style={{ maxWidth: '820px' }}>
          <div className="text-center mb-4" data-aos="fade-up">
            <h3 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.3px' }}>
              Questions <span style={{ color: ACCENT }}>fréquentes</span>
            </h3>
            <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
              Les réponses aux questions que l'on me pose le plus souvent.
            </p>
          </div>

          <div className="d-flex flex-column gap-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={item.question}
                  className="rounded-4 overflow-hidden"
                  style={{ backgroundColor: cardBg, border: isOpen ? `1px solid ${ACCENT}55` : cardBorder, transition: 'border-color 0.3s ease' }}
                  data-aos="fade-up"
                  data-aos-delay={80 + i * 60}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-100 d-flex align-items-center justify-content-between gap-3 text-start px-4 py-3"
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-main)' }}
                  >
                    <span className="fw-semibold">{item.question}</span>
                    {isOpen
                      ? <MdExpandLess size={24} style={{ color: ACCENT, flexShrink: 0 }} />
                      : <MdExpandMore size={24} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3">
                      <p className="small mb-0" style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Appel à l'action final */}
        <div
          className="text-center rounded-4 p-4 p-lg-5 mt-5 mx-auto"
          style={{ backgroundColor: cardBg, border: `1px solid ${ACCENT}55`, maxWidth: '820px' }}
          data-aos="zoom-in"
        >
          <h3 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.3px' }}>
            Un projet en tête ? <span style={{ color: ACCENT }}>Parlons-en.</span>
          </h3>
          <p className="small mb-4 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '560px' }}>
            Expliquez-moi votre besoin en quelques lignes, même si l'idée n'est pas encore tout à fait claire. Je vous répondrai avec des conseils adaptés à votre projet.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link
              to="/contact"
              className="btn px-4 py-2 rounded-pill fw-bold d-inline-flex align-items-center gap-2"
              style={{ backgroundColor: ACCENT, color: isDark ? '#020617' : '#ffffff', border: 'none' }}
            >
              Me contacter <FaArrowRight size={12} />
            </Link>
            <Link
              to="/project"
              className="btn px-4 py-2 rounded-pill fw-bold"
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-main)', border: '2px solid var(--color-border)' }}
            >
              Voir mes projets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}