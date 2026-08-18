import React, { useEffect, useState, useRef, useMemo } from 'react';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import { MdFolder, MdSearch, MdCode, MdRocket, MdImage } from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

import { ProjectService } from '../Services/ProjectService';
import type { Project } from '../Models/Project';
import photo from '../assets/Project1.png';
import { getStorageUrl } from '../Services/api';
import { useTheme } from '../Context/ThemeContext';

// Photo utilisée à la fois pour l'en-tête (carte tilt à droite, comme sur Skills)
// et comme image de secours pour un projet qui n'a pas encore d'image en base.
const headerPhoto = photo;

type GeometryKind = 'icosahedron' | 'torus' | 'octahedron';

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

function ProjectsBackground3D({ isMobile, accent, isDark }: { isMobile: boolean; accent: string; isDark: boolean }) {
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
   CARTE PHOTO D'EN-TÊTE AVEC EFFET TILT 3D (comme sur Skills)
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
   CARTE PROJET AVEC EFFET TILT 3D (même esprit que PhotoTiltCard)
   ============================================================ */
function ProjectTiltCard({ children }: { children: React.ReactNode }) {
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
   CARTE DE PROJET
   ============================================================ */
function ProjectCard({
  project,
  index,
  accent,
  isDark
}: {
  project: Project;
  index: number;
  accent: string;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const imageSrc = project.image_url
    ? getStorageUrl(project.image_url)
    : photo;

  const description = project.description || '';
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
      <ProjectTiltCard>
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
              alt={project.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div className="p-4 d-flex flex-column" style={{ minHeight: '180px' }}>
            <h5 className="fw-bold mb-2" style={{ color: 'var(--color-text-main)' }}>{project.title}</h5>

            <p
              className="small mb-1"
              style={
                expanded
                  ? { color: 'var(--color-text-muted)' }
                  : {
                      color: 'var(--color-text-muted)',
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

            <div className="d-flex gap-2 mt-auto pt-2">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm fw-semibold d-flex align-items-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    color: 'var(--color-text-main)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)'
                  }}
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
                  style={{
                    backgroundColor: accent,
                    color: isDark ? '#020617' : '#ffffff',
                    borderRadius: '10px',
                    border: 'none'
                  }}
                >
                  <FaExternalLinkAlt size={12} /> Démo
                </a>
              )}
            </div>
          </div>
        </div>
      </ProjectTiltCard>
    </div>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function ProjectsContent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Accents recalculés selon le thème (identique à Home / About / Contact / Login)
  const ACCENT = isDark ? '#38bdf8' : '#0284c7';
  const GREEN = isDark ? '#22c55e' : '#15803d';

  const pageBg = isDark ? '#020617' : 'var(--color-bg)';
  const cardBg = 'var(--color-surface)';
  const cardBorder = '1px solid var(--color-border)';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isMobile = useIsMobile();

  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });

    const loadProjects = async () => {
      try {
        const response = await ProjectService.getAll();
        const data = response.data || response;
        setProjects(Array.isArray(data) ? data : (data.data || []));
      } catch (error) {
        console.error("Erreur lors du chargement des projets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter((p) =>
    !searchTerm || (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: pageBg, paddingTop: '80px', paddingBottom: '60px', transition: 'background-color 0.3s ease' }}>
      <ProjectsBackground3D isMobile={isMobile} accent={ACCENT} isDark={isDark} />

      <div className="container-fluid position-relative py-4 px-4 px-lg-5" style={{ zIndex: 2, color: 'var(--color-text-main)' }}>
        {/* En-tête — texte aligné à gauche, photo à droite (comme Home / Skills / Contact) */}
        <div className="row align-items-center mb-5 g-4" data-aos="fade-up">
          <div className="col-lg-7 text-start">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3"
              style={{ backgroundColor: cardBg, border: `1px solid ${ACCENT}55` }}
            >
              <MdFolder style={{ color: ACCENT }} />
              <span className="small text-uppercase fw-semibold" style={{ color: ACCENT, letterSpacing: '2px' }}>
                Portfolio
              </span>
            </div>
            <h2 className="fw-bold display-5 mb-3" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>
              Mes <span style={{ color: ACCENT }}>Projets</span>
            </h2>
            <p className="lead fs-6 mb-4" style={{ color: 'var(--color-text-muted)', maxWidth: '650px' }}>
              Une sélection de projets web et mobiles que j'ai conçus et développés, du prototypage à la mise en production.
            </p>

            <div className="row g-3 mt-2" style={{ maxWidth: '680px' }}>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="100">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: cardBg, border: cardBorder }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdCode style={{ color: ACCENT }} className="fs-5" />
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--color-text-main)' }}>Réalisations concrètes</h6>
                  </div>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                    Des applications complètes, du back-end à l'interface, pensées pour être robustes et évolutives.
                  </p>
                </div>
              </div>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="200">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: cardBg, border: cardBorder }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdRocket style={{ color: GREEN }} className="fs-5" />
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--color-text-main)' }}>Code source & démos</h6>
                  </div>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                    Chaque projet donne accès au dépôt GitHub et, quand c'est possible, à une démo en ligne.
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
                    alt="Projets Visual"
                    className="img-fluid rounded-3"
                    style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover' }}
                  />
                </div>
              </HeaderPhotoTiltCard>
            </div>
          </div>
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
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}
              />
            </div>
          </div>
        </div>

        {/* Grille de projets */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: ACCENT }}></div>
            <p className="mt-3 fw-semibold" style={{ color: 'var(--color-text-main)' }}>Chargement de mes projets...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div
            className="text-center py-5 card border-0 shadow-sm p-5 mx-auto"
            style={{ borderRadius: '20px', backgroundColor: cardBg, border: cardBorder, maxWidth: '600px' }}
          >
            <MdImage size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
            <h4 className="fw-semibold" style={{ color: 'var(--color-text-main)' }}>Aucun projet trouvé.</h4>
          </div>
        ) : (
          <div className="row g-4">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} accent={ACCENT} isDark={isDark} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}