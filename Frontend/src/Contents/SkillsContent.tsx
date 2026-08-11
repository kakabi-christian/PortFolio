import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MdStorage,
  MdCode,
  MdBuild,
  MdSearch,
  MdImage,
  MdLightbulb,
  MdRocket
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring
} from 'framer-motion';
import photo1 from '../assets/Skills.png';

import { toolService } from '../Services/ToolService';
import { frameworkService } from '../Services/FrameworkService';
import { databaseService } from '../Services/DatabaseService';

import type { Tool } from '../Models/Tool';
import type { Framework } from '../Models/Framework';
import type { Database } from '../Models/Database';

type TabKey = 'all' | 'frameworks' | 'databases' | 'tools';
type GeometryKind = 'icosahedron' | 'torus' | 'octahedron';

/* ============================================================
   THEME — un "univers" visuel distinct par catégorie
   ============================================================ */
const UNIVERSE: Record<TabKey, { accent: string; glow: string; label: string; geometries: GeometryKind[] }> = {
  all:        { accent: '#60a5fa', glow: 'rgba(96,165,250,0.35)',  label: 'Vue globale',        geometries: ['icosahedron', 'torus', 'octahedron'] },
  frameworks: { accent: '#3b82f6', glow: 'rgba(59,130,246,0.40)',  label: 'Frameworks',         geometries: ['icosahedron', 'octahedron'] },
  databases:  { accent: '#22d3ee', glow: 'rgba(34,211,238,0.40)',  label: 'Bases de données',   geometries: ['torus', 'icosahedron'] },
  tools:      { accent: '#8b7cf6', glow: 'rgba(139,124,246,0.38)', label: 'Outils & DevOps',    geometries: ['octahedron', 'torus'] }
};

/* ============================================================
   HOOKS UTILITAIRES
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const listener = () => setReduced(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);
  return reduced;
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
   SCENE 3D — laboratoire technologique en arrière-plan
   (ambiance immersive ; les cartes de compétences réelles
   restent en DOM pour rester nettes, accessibles et légères)
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

function LabBackground3D({ activeTab, isMobile }: { activeTab: TabKey; isMobile: boolean }) {
  const mouse = useMousePosition();
  const scroll = useScrollDepth();
  const theme = UNIVERSE[activeTab];

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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={isMobile ? [1, 1] : [1, 1.5]}>
        <SceneRig mouse={mouse} scroll={scroll}>
          <SkillCore accent={theme.accent} />
          <Particles count={isMobile ? 50 : 140} accent={theme.accent} />
          {visibleShapes.map((pos, i) => (
            <FloatingShape
              key={i}
              position={pos}
              geometry={theme.geometries[i % theme.geometries.length]}
              speed={0.4 + i * 0.12}
              color={theme.accent}
            />
          ))}
          {!isMobile && <ConnectionLines points={visibleShapes} accent={theme.accent} />}
        </SceneRig>
      </Canvas>
    </div>
  );
}

function StaticBackground({ accent }: { accent: string }) {
  // Fallback pour "prefers-reduced-motion" : ambiance sans animation
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at 20% 20%, ${accent}22, transparent 55%), radial-gradient(circle at 80% 70%, ${accent}18, transparent 55%)`
      }}
    />
  );
}

function PortalFlash({ activeKey, accent }: { activeKey: string; accent: string }) {
  return (
    <AnimatePresence>
      <motion.div
        key={activeKey}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: `radial-gradient(circle at 50% 35%, ${accent}55, transparent 60%)`
        }}
      />
    </AnimatePresence>
  );
}

/* ============================================================
   CARTE PHOTO AVEC EFFET TILT 3D (conservée)
   ============================================================ */
function PhotoTiltCard({ children, accent }: { children: React.ReactNode; accent: string }) {
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
   ANNEAU DE MAÎTRISE — remplace la barre de progression
   ============================================================ */
function CircularLevel({ percentage, accent, size = 56 }: { percentage: number; accent: string; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(percentage * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percentage]);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
      <text
        x="50%"
        y="50%"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.24}
        fontFamily="monospace"
        fontWeight={700}
        fill="#ffffff"
      >
        {display}%
      </text>
    </svg>
  );
}

/* ============================================================
   CARTE TECHNOLOGIE — glassmorphism + tilt 3D + glow
   ============================================================ */
function TechCard({
  name,
  badge,
  iconUrl,
  percentage,
  accent,
  glow,
  index
}: {
  name: string;
  badge?: string;
  iconUrl?: string;
  percentage: number;
  accent: string;
  glow: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 50, rotateX: -18, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.6), ease: 'easeOut' }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 900, height: '100%' }}
    >
      <motion.div
        animate={{ scale: hovered ? 1.03 : 1, y: hovered ? -4 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="h-100 p-4 position-relative"
        style={{
          borderRadius: '18px',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          border: `1px solid ${hovered ? accent : 'rgba(255,255,255,0.12)'}`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: hovered ? `0 0 28px ${glow}, inset 0 0 22px ${glow}` : '0 4px 18px rgba(0,0,0,0.25)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        <div className="d-flex align-items-center mb-3 gap-3">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={name}
              style={{
                width: 44,
                height: 44,
                objectFit: 'contain',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                padding: 6,
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MdImage size={20} color="#94a3b8" />
            </div>
          )}
          <div className="flex-grow-1">
            <h6 className="fw-bold mb-1 text-white">{name}</h6>
            {badge && (
              <span
                className="badge px-2 py-1 fw-semibold"
                style={{ backgroundColor: `${accent}26`, color: accent, fontSize: '0.7rem', borderRadius: 6 }}
              >
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <span className="font-monospace" style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px' }}>
            MAÎTRISE
          </span>
          <CircularLevel percentage={percentage} accent={accent} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function SkillsContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  // État pour alterner les photos toutes les 2 secondes avec transition fluide
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const photos = [photo1];

  useEffect(() => {
    const photoInterval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, 2000);
    return () => clearInterval(photoInterval);
  }, [photos.length]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [fwRes, dbRes, toolRes] = await Promise.all([
        frameworkService.getAll(1, '', '', 50),
        databaseService.getAll(1, 50),
        toolService.getAll(1, 50)
      ]);

      const extractedFrameworks = fwRes?.data?.data || fwRes?.data || fwRes || [];
      const extractedDatabases = dbRes?.data?.data || dbRes?.data || dbRes || [];

      const rawTools = toolRes?.data?.data || toolRes?.data || toolRes || [];
      const extractedTools = Array.isArray(rawTools)
        ? rawTools
        : Array.isArray(rawTools.data)
        ? rawTools.data
        : Object.values(rawTools).find((val) => Array.isArray(val)) || [];

      setFrameworks(Array.isArray(extractedFrameworks) ? extractedFrameworks : []);
      setDatabases(Array.isArray(extractedDatabases) ? extractedDatabases : []);
      setTools(Array.isArray(extractedTools) ? extractedTools : []);
    } catch (err) {
      console.error('❌ [SkillsContent] Erreur lors du chargement des compétences', err);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = (items: any[]) => {
    if (!searchTerm) return items;
    return items.filter((item) => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filteredFrameworks = filterItems(frameworks);
  const filteredDatabases = filterItems(databases);
  const filteredTools = filterItems(tools);

  const totalCount = filteredFrameworks.length + filteredDatabases.length + filteredTools.length;
  const theme = UNIVERSE[activeTab];

  const levelOf = (item: any) => {
    const raw = item.level ? String(item.level).replace('%', '').trim() : '0';
    return isNaN(Number(raw)) ? 50 : Number(raw);
  };
  const iconOf = (item: any) => (item.icon ? `http://127.0.0.1:8000/storage/${item.icon}` : undefined);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#020617', paddingTop: '80px', paddingBottom: '60px' }}>
      {prefersReducedMotion ? (
        <StaticBackground accent={theme.accent} />
      ) : (
        <LabBackground3D activeTab={activeTab} isMobile={isMobile} />
      )}
      {!prefersReducedMotion && <PortalFlash activeKey={activeTab} accent={theme.accent} />}

      <div className="container-fluid position-relative py-4 px-4 px-lg-5" style={{ zIndex: 2, color: '#ffffff' }}>
        {/* En-tête */}
        <div className="row align-items-center mb-5 g-4" data-aos="fade-up">
          <div className="col-lg-7 text-start">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${theme.accent}55`, transition: 'border-color 0.4s ease' }}
            >
              <MdCode style={{ color: theme.accent }} />
              <span className="small text-uppercase fw-semibold" style={{ color: theme.accent, letterSpacing: '2px' }}>
                Laboratoire Technologique
              </span>
            </div>
            <h2 className="fw-bold display-5 mb-3 text-white" style={{ letterSpacing: '-0.5px' }}>
              Mes <span style={{ color: theme.accent, transition: 'color 0.4s ease' }}>Compétences</span>
            </h2>
            <p className="lead fs-6 mb-4" style={{ color: '#cbd5e1', maxWidth: '650px' }}>
              Explorez les technologies, frameworks, bases de données et outils que j'utilise pour concevoir des applications web et mobiles performantes — organisés comme trois univers d'un même stack.
            </p>

            <div className="row g-3 mt-2" style={{ maxWidth: '680px' }}>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="100">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdLightbulb style={{ color: theme.accent }} className="fs-5" />
                    <h6 className="fw-bold mb-0 text-white">Maîtrise & Évolution</h6>
                  </div>
                  <p className="small mb-0" style={{ color: '#94a3b8' }}>
                    Des langages fondamentaux aux frameworks modernes évalués selon des niveaux d'expertise continus.
                  </p>
                </div>
              </div>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="200">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdRocket style={{ color: '#22c55e' }} className="fs-5" />
                    <h6 className="fw-bold mb-0 text-white">DevOps & Outils</h6>
                  </div>
                  <p className="small mb-0" style={{ color: '#94a3b8' }}>
                    Automatisation, conteneurisation et gestion de bases de données pour des environnements robustes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5 text-end d-flex justify-content-lg-end justify-content-center">
            <div className="position-relative d-inline-block">
              <div
                className="position-absolute top-50 start-50 translate-middle rounded-circle"
                style={{
                  width: '380px',
                  height: '380px',
                  background: `radial-gradient(circle, ${theme.glow} 0%, rgba(34,197,94,0.05) 70%)`,
                  zIndex: 0,
                  filter: 'blur(35px)',
                  transition: 'background 0.6s ease'
                }}
              ></div>

              <PhotoTiltCard accent={theme.accent}>
                <div
                  className="p-3 rounded-4 position-relative shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
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
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentPhotoIndex}
                      src={photos[currentPhotoIndex]}
                      alt="Skills Visual"
                      className="img-fluid rounded-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover' }}
                    />
                  </AnimatePresence>
                </div>
              </PhotoTiltCard>
            </div>
          </div>
        </div>

        {/* Recherche + Onglets */}
        <div className="row justify-content-center mb-5 g-3" data-aos="fade-up" data-aos-delay="100">
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="input-group shadow-sm"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1px solid ${theme.accent}55`,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: 'border-color 0.4s ease'
              }}
            >
              <span className="input-group-text border-0 bg-transparent ps-3" style={{ color: '#94a3b8' }}>
                <MdSearch size={22} />
              </span>
              <input
                type="text"
                className="form-control shadow-none border-0 py-3 bg-transparent text-white"
                placeholder="Rechercher une technologie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.95rem', color: '#ffffff' }}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-7 d-flex justify-content-center justify-content-md-start align-items-center gap-2 flex-wrap">
            {(['all', 'frameworks', 'databases', 'tools'] as TabKey[]).map((key) => {
              const t = UNIVERSE[key];
              const isActive = activeTab === key;
              const labelMap: Record<TabKey, string> = {
                all: 'Tout voir',
                frameworks: 'Frameworks',
                databases: 'Bases de données',
                tools: 'Outils & DevOps'
              };
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="btn fw-bold px-4 py-2 shadow-sm"
                  style={{
                    backgroundColor: isActive ? t.accent : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#020617' : '#e2e8f0',
                    borderRadius: '12px',
                    border: `1px solid ${isActive ? t.accent : 'rgba(255, 255, 255, 0.15)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {labelMap[key]}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: theme.accent }}></div>
            <p className="mt-3 fw-semibold text-white">Chargement de vos compétences...</p>
          </div>
        ) : totalCount === 0 ? (
          <div
            className="text-center py-5 card border-0 shadow-sm p-5"
            style={{ borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <h4 className="fw-semibold text-white">Aucun résultat trouvé pour votre recherche.</h4>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="row g-4"
              initial={{ opacity: 0, scale: 0.9, rotateX: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.08, rotateX: -12, filter: 'blur(8px)' }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{ transformPerspective: 1200 }}
            >
              {/* FRAMEWORKS */}
              {(activeTab === 'all' || activeTab === 'frameworks') && filteredFrameworks.length > 0 && (
                <div className="col-12 mb-4" data-aos="fade-up">
                  <div className="d-flex align-items-center mb-3">
                    <div className="p-2 rounded-3 me-2 shadow-sm" style={{ backgroundColor: `${UNIVERSE.frameworks.accent}33`, color: UNIVERSE.frameworks.accent }}>
                      <MdCode size={24} />
                    </div>
                    <h3 className="fw-bold mb-0 text-white">Frameworks & Langages</h3>
                  </div>
                  <div className="row g-4">
                    {filteredFrameworks.map((fw: any, index: number) => (
                      <div className="col-12 col-md-6 col-lg-4" key={fw.id || index}>
                        <TechCard
                          name={fw.name}
                          badge={fw.type}
                          iconUrl={iconOf(fw)}
                          percentage={levelOf(fw)}
                          accent={UNIVERSE.frameworks.accent}
                          glow={UNIVERSE.frameworks.glow}
                          index={index}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DATABASES */}
              {(activeTab === 'all' || activeTab === 'databases') && filteredDatabases.length > 0 && (
                <div className="col-12 mb-4" data-aos="fade-up">
                  <div className="d-flex align-items-center mb-3">
                    <div className="p-2 rounded-3 me-2 shadow-sm" style={{ backgroundColor: `${UNIVERSE.databases.accent}33`, color: UNIVERSE.databases.accent }}>
                      <MdStorage size={24} />
                    </div>
                    <h3 className="fw-bold mb-0 text-white">Bases de Données</h3>
                  </div>
                  <div className="row g-4">
                    {filteredDatabases.map((db: any, index: number) => (
                      <div className="col-12 col-md-6 col-lg-4" key={db.id || index}>
                        <TechCard
                          name={db.name}
                          badge={db.type}
                          iconUrl={iconOf(db)}
                          percentage={levelOf(db)}
                          accent={UNIVERSE.databases.accent}
                          glow={UNIVERSE.databases.glow}
                          index={index}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOOLS */}
              {(activeTab === 'all' || activeTab === 'tools') && filteredTools.length > 0 && (
                <div className="col-12 mb-4" data-aos="fade-up">
                  <div className="d-flex align-items-center mb-3">
                    <div className="p-2 rounded-3 me-2 shadow-sm" style={{ backgroundColor: `${UNIVERSE.tools.accent}33`, color: UNIVERSE.tools.accent }}>
                      <MdBuild size={24} />
                    </div>
                    <h3 className="fw-bold mb-0 text-white">Outils & DevOps</h3>
                  </div>
                  <div className="row g-4">
                    {filteredTools.map((tool: any, index: number) => (
                      <div className="col-12 col-md-6 col-lg-4" key={tool.id || index}>
                        <TechCard
                          name={tool.name}
                          badge={tool.category}
                          iconUrl={iconOf(tool)}
                          percentage={levelOf(tool)}
                          accent={UNIVERSE.tools.accent}
                          glow={UNIVERSE.tools.glow}
                          index={index}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}