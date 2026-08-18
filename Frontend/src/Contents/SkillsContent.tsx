import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MdCode,
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
import { Line, Html } from '@react-three/drei';
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
import { useTheme } from '../Context/ThemeContext';

import type { Tool } from '../Models/Tool';
import type { Framework } from '../Models/Framework';
import type { Database } from '../Models/Database';
import { getStorageUrl } from '../Services/api';

type TabKey = 'all' | 'frameworks' | 'databases' | 'tools';
type GeometryKind = 'icosahedron' | 'torus' | 'octahedron';
type SkillGroup = 'frameworks' | 'databases' | 'tools';

interface SkillItem {
  id: string; // toujours préfixé par "group-" => unique même en vue "all"
  name: string;
  badge?: string;
  iconUrl?: string;
  level: number;
  group: SkillGroup;
}

interface OrbitLayout {
  radius: number;
  baseAngle: number;
  ring: number;
  ySeed: number;
  speed: number;
}

function clampPct(v: number) {
  return Math.min(100, Math.max(0, v));
}

/* ============================================================
   THEME — un "univers" visuel distinct par catégorie
   Deux palettes (dark / light) : recalculées en JS car WebGL/Three.js
   ne peut pas lire les variables CSS directement.
   ============================================================ */
const UNIVERSE_DARK: Record<TabKey, { accent: string; glow: string; label: string; geometries: GeometryKind[] }> = {
  all:        { accent: '#60a5fa', glow: 'rgba(96,165,250,0.35)',  label: 'Vue globale',        geometries: ['icosahedron', 'torus', 'octahedron'] },
  frameworks: { accent: '#3b82f6', glow: 'rgba(59,130,246,0.40)',  label: 'Frameworks',         geometries: ['icosahedron', 'octahedron'] },
  databases:  { accent: '#22d3ee', glow: 'rgba(34,211,238,0.40)',  label: 'Bases de données',   geometries: ['torus', 'icosahedron'] },
  tools:      { accent: '#8b7cf6', glow: 'rgba(139,124,246,0.38)', label: 'Outils & DevOps',    geometries: ['octahedron', 'torus'] }
};

const UNIVERSE_LIGHT: Record<TabKey, { accent: string; glow: string; label: string; geometries: GeometryKind[] }> = {
  all:        { accent: '#2563eb', glow: 'rgba(37,99,235,0.16)',   label: 'Vue globale',        geometries: ['icosahedron', 'torus', 'octahedron'] },
  frameworks: { accent: '#1d4ed8', glow: 'rgba(29,78,216,0.18)',   label: 'Frameworks',         geometries: ['icosahedron', 'octahedron'] },
  databases:  { accent: '#0284c7', glow: 'rgba(2,132,199,0.18)',   label: 'Bases de données',   geometries: ['torus', 'icosahedron'] },
  tools:      { accent: '#7c3aed', glow: 'rgba(124,58,237,0.16)',  label: 'Outils & DevOps',    geometries: ['octahedron', 'torus'] }
};

function getUniverse(isDark: boolean) {
  return isDark ? UNIVERSE_DARK : UNIVERSE_LIGHT;
}

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

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/* ============================================================
   SCENE 3D DE FOND — laboratoire technologique (inchangé)
   ============================================================ */
function BackgroundFloatingShape({
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
      <meshBasicMaterial color={accent} wireframe transparent opacity={0.16} />
    </mesh>
  );
}

function BackgroundConnectionLines({ points, accent }: { points: [number, number, number][]; accent: string }) {
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

function BackgroundParticles({ count, accent }: { count: number; accent: string }) {
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

function BackgroundSceneRig({
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

function LabBackground3D({ activeTab, isMobile, isDark }: { activeTab: TabKey; isMobile: boolean; isDark: boolean }) {
  const mouse = useMousePosition();
  const scroll = useScrollDepth();
  const theme = getUniverse(isDark)[activeTab];

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
        <BackgroundSceneRig mouse={mouse} scroll={scroll}>
          <BackgroundCore accent={theme.accent} />
          {/* Moins de particules en light mode : plus visibles/denses sur fond clair */}
          <BackgroundParticles count={isMobile ? 50 : isDark ? 140 : 90} accent={theme.accent} />
          {visibleShapes.map((pos, i) => (
            <BackgroundFloatingShape
              key={i}
              position={pos}
              geometry={theme.geometries[i % theme.geometries.length]}
              speed={0.4 + i * 0.12}
              color={theme.accent}
            />
          ))}
          {!isMobile && <BackgroundConnectionLines points={visibleShapes} accent={theme.accent} />}
        </BackgroundSceneRig>
      </Canvas>
    </div>
  );
}

function StaticBackground({ accent }: { accent: string }) {
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

/* ============================================================
   CARTE PHOTO AVEC EFFET TILT 3D (inchangée)
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
   DISPOSITION ORBITALE DYNAMIQUE
   ============================================================ */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function useOrbitLayout(count: number, isMobile: boolean): OrbitLayout[] {
  return useMemo(() => {
    const maxPerRing = isMobile ? 6 : 9;
    const rings = Math.max(1, Math.ceil(count / maxPerRing));
    const baseRadius = isMobile ? 2.4 : 3.3;
    const ringGap = isMobile ? 1.0 : 1.45;
    const layout: OrbitLayout[] = [];
    for (let i = 0; i < count; i++) {
      const ring = i % rings;
      const indexInRing = Math.floor(i / rings);
      layout.push({
        radius: baseRadius + ring * ringGap,
        baseAngle: indexInRing * GOLDEN_ANGLE + ring * 0.6,
        ring,
        ySeed: (i * 0.37) % (Math.PI * 2),
        speed: 0.05 + (ring % 3) * 0.015 + (i % 5) * 0.003
      });
    }
    return layout;
  }, [count, isMobile]);
}

function nodePosition(t: number, layout: OrbitLayout, hovered: boolean, ringCountFactor: number): [number, number, number] {
  const angle = layout.baseAngle + t * layout.speed;
  const wobble = Math.sin(t * 0.6 + layout.ySeed) * 0.12;
  const radius = layout.radius + wobble + (hovered ? -0.55 : 0);
  const y = Math.sin(t * 0.5 + layout.ySeed) * 0.35 + Math.sin(layout.ring * 1.7) * 0.5 * ringCountFactor;
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
}

/* ============================================================
   CAMERA RIG DE LA SCÈNE ORBITALE
   ============================================================ */
function OrbitCameraRig({
  mouse,
  scroll,
  pulsing
}: {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  scroll: React.MutableRefObject<number>;
  pulsing: boolean;
}) {
  const pulse = useRef(0);
  useFrame(({ camera }) => {
    pulse.current += ((pulsing ? 1 : 0) - pulse.current) * 0.06;
    const targetX = mouse.current.x * 1.1;
    const targetY = 1.1 - mouse.current.y * 0.7;
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
    const targetZ = 9 - scroll.current * 1.6 - pulse.current * 2.2;
    camera.position.z += (targetZ - camera.position.z) * 0.035;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ============================================================
   NOYAU DES COMPÉTENCES (pulsation lors des transitions d'onglet)
   ============================================================ */
function SkillOrbitCore({ accent, pulsing }: { accent: string; pulsing: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const current = useRef(new THREE.Color(accent));
  const target = useMemo(() => new THREE.Color(accent), [accent]);
  const intensity = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    intensity.current += ((pulsing ? 1 : 0) - intensity.current) * 0.08;
    current.current.lerp(target, 0.03);

    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 0.6) * 0.05 + intensity.current * 0.35;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y = t * 0.12;
      coreRef.current.rotation.x = t * 0.07;
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(current.current);
      mat.opacity = 0.16 + intensity.current * 0.5;
    }
    if (glowRef.current) {
      const s = 1.9 + intensity.current * 0.8;
      glowRef.current.scale.setScalar(s);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + intensity.current * 0.18;
    }
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.25;
      ring1.current.rotation.z = t * 0.1;
    }
    if (ring2.current) {
      ring2.current.rotation.y = t * 0.2;
      ring2.current.rotation.z = -t * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial color={accent} transparent opacity={0.06} />
      </mesh>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.16} />
      </mesh>
      <mesh ref={ring1} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.85, 0.012, 8, 100]} />
        <meshBasicMaterial color={accent} transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3.4, Math.PI / 5, 0]}>
        <torusGeometry args={[2.25, 0.008, 8, 100]} />
        <meshBasicMaterial color={accent} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

/* ============================================================
   COUCHE DE PARTICULES ORBITALES
   ============================================================ */
function OrbitParticleLayer({
  count,
  accent,
  spread,
  speed,
  converge
}: {
  count: number;
  accent: string;
  spread: number;
  speed: number;
  converge: boolean;
}) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.55;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread - spread * 0.2;
    }
    return arr;
  }, [count, spread]);

  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pointsRef.current) pointsRef.current.rotation.y = t * speed;
    if (groupRef.current) {
      const targetScale = converge ? 0.05 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.06);
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={accent} size={0.025} transparent opacity={0.45} sizeAttenuation />
      </points>
    </group>
  );
}

/* ============================================================
   ANNEAU DE MAÎTRISE — piloté par un spring physique
   ============================================================ */
function CircularLevel({ percentage, accent, size = 40, isDark }: { percentage: number; accent: string; size?: number; isDark: boolean }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;

  const motionPercentage = useMotionValue(0);
  const springPercentage = useSpring(motionPercentage, { stiffness: 140, damping: 14, mass: 0.7 });
  const dashOffset = useTransform(springPercentage, (v) => circumference - (clampPct(v) / 100) * circumference);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    motionPercentage.set(0);
    const raf = requestAnimationFrame(() => motionPercentage.set(percentage));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage]);

  useEffect(() => {
    const unsubscribe = springPercentage.on('change', (v) => setDisplay(Math.round(clampPct(v))));
    return unsubscribe;
  }, [springPercentage]);

  const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.12)';
  const textColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={3} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: dashOffset }}
      />
      <text
        x="50%"
        y="50%"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.26}
        fontFamily="monospace"
        fontWeight={700}
        fill={textColor}
      >
        {display}%
      </text>
    </svg>
  );
}

/* ============================================================
   PANNEAU HOLOGRAPHIQUE (info compétence au survol)
   ============================================================ */
function HolographicPanel({ item, accent, active, isDark }: { item: SkillItem; accent: string; active: boolean; isDark: boolean }) {
  const panelBg = isDark
    ? 'linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))'
    : 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const sweepColor = isDark ? `${accent}33` : `${accent}22`;

  return (
    <motion.div
      style={{
        width: active ? 172 : 128,
        padding: active ? '12px 14px' : '7px 10px',
        borderRadius: 12,
        background: panelBg,
        border: `1px solid ${active ? accent : accent + '55'}`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
      animate={{
        scale: active ? 1 : 0.94,
        y: active ? -3 : 0,
        boxShadow: active
          ? [`0 0 12px ${accent}55`, `0 0 26px ${accent}99`, `0 0 12px ${accent}55`]
          : `0 0 8px ${accent}22`
      }}
      transition={
        active
          ? { boxShadow: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.25 }, y: { duration: 0.25 } }
          : { duration: 0.25 }
      }
    >
      {active && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: `linear-gradient(90deg, transparent, ${sweepColor}, transparent)`,
            pointerEvents: 'none'
          }}
          initial={{ x: '-60%' }}
          animate={{ x: '160%' }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'linear', repeatDelay: 0.4 }}
        />
      )}

      {item.iconUrl ? (
        <img
          src={item.iconUrl}
          alt={item.name}
          style={{ width: active ? 26 : 20, height: active ? 26 : 20, objectFit: 'contain', flexShrink: 0 }}
        />
      ) : (
        <MdImage size={active ? 18 : 14} color="#94a3b8" />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: active ? 12.5 : 10.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        {active && item.badge && (
          <div style={{ fontSize: 9, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{item.badge}</div>
        )}
      </div>
      {active && <CircularLevel percentage={item.level} accent={accent} size={34} isDark={isDark} />}
    </motion.div>
  );
}

/* ============================================================
   ANNEAU "PING" — effet radar/sonar au survol
   ============================================================ */
function HoverPingRing({ accent, active }: { accent: string; active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const mesh = ringRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();

    if (!active) {
      startTime.current = null;
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
      return;
    }
    if (startTime.current === null) startTime.current = t;

    const duration = 1.1;
    const elapsed = (t - startTime.current) % duration;
    const progress = elapsed / duration;
    const scale = 0.4 + progress * 1.6;
    mesh.scale.setScalar(scale);
    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - progress);
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.22, 0.27, 32]} />
      <meshBasicMaterial color={accent} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ============================================================
   HALO LUMINEUX au survol
   ============================================================ */
function HoverGlow({ accent, active }: { accent: string; active: boolean }) {
  const glowRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0);

  useFrame(() => {
    const mesh = glowRef.current;
    if (!mesh) return;
    const targetScale = active ? 1 : 0;
    scaleRef.current += (targetScale - scaleRef.current) * 0.15;
    const s = 0.15 + scaleRef.current * 0.55;
    mesh.scale.setScalar(s);
    (mesh.material as THREE.MeshBasicMaterial).opacity = scaleRef.current * 0.5;
  });

  return (
    <mesh ref={glowRef}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={accent} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ============================================================
   NŒUD DE COMPÉTENCE ORBITAL
   ============================================================ */
function SkillNode({
  item,
  layout,
  index,
  accent,
  hoveredId,
  setHoveredId,
  collapsing,
  ringCountFactor,
  isDark
}: {
  item: SkillItem;
  layout: OrbitLayout;
  index: number;
  accent: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  collapsing: boolean;
  ringCountFactor: number;
  isDark: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null);
  const flowRef = useRef<THREE.Mesh>(null);
  const spawnStart = useRef<number | null>(null);
  const collapseStart = useRef<number | null>(null);

  const isHovered = hoveredId === item.id;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spawnStart.current === null) spawnStart.current = t + index * 0.025;
    const spawnEase = 1 - Math.pow(1 - clamp01((t - spawnStart.current) / 0.9), 3);

    if (collapsing) {
      if (collapseStart.current === null) collapseStart.current = t;
    } else {
      collapseStart.current = null;
    }
    const collapseP = collapseStart.current !== null ? clamp01((t - collapseStart.current) / 0.4) : 0;
    const shrink = 1 - collapseP;

    const [bx, by, bz] = nodePosition(t, layout, isHovered, ringCountFactor);
    const x = bx * spawnEase * shrink;
    const y = by * spawnEase * shrink;
    const z = bz * spawnEase * shrink;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      const targetScale = (isHovered ? 1.4 : hoveredId && hoveredId !== item.id ? 0.72 : 1) * spawnEase;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
    if (meshRef.current) {
      const spin = isHovered ? 1.8 : 1;
      meshRef.current.rotation.y = t * 0.4 * spin;
      meshRef.current.rotation.x = t * 0.25 * spin;
    }
    if (lineRef.current?.geometry?.setPositions) {
      lineRef.current.geometry.setPositions([0, 0, 0, x, y, z]);
    }
    if (flowRef.current) {
      const flowT = (t * 0.5 + layout.ySeed) % 1;
      flowRef.current.position.set(x * flowT, y * flowT, z * flowT);
      (flowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * spawnEase;
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={[
          [0, 0, 0],
          [0, 0, 0]
        ]}
        color={accent}
        transparent
        opacity={isHovered ? 0.9 : 0.22}
        lineWidth={1}
      />
      <mesh ref={flowRef}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={accent} transparent opacity={0.7} />
      </mesh>
      <group
        ref={groupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredId(item.id);
        }}
        onPointerOut={() => setHoveredId(null)}
      >
        <HoverGlow accent={accent} active={isHovered} />
        <HoverPingRing accent={accent} active={isHovered} />

        <mesh ref={meshRef}>
          <icosahedronGeometry args={[0.2, 0]} />
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.85} />
        </mesh>
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <HolographicPanel item={item} accent={accent} active={isHovered} isDark={isDark} />
        </Html>
      </group>
    </group>
  );
}

/* ============================================================
   FLASH DE TRANSITION LORS DU CHANGEMENT D'ONGLET
   ============================================================ */
function OrbitPortalFlash({ active, accent }: { active: boolean; accent: string }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none',
            background: `radial-gradient(circle at 50% 55%, ${accent}, transparent 62%)`
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   CANVAS DÉDIÉ À L'AFFICHAGE ORBITAL DES COMPÉTENCES
   ------------------------------------------------------------
   ⚠️ FIX : ce n'est PAS un calque "fixed" plein écran (ça, c'est
   ce qui causait le recouvrement du texte). C'est un bloc normal,
   dans le flux de page, avec une hauteur garantie (vh + minHeight
   en px en filet de sécurité). "overflow" reste visible pour ne
   pas couper les info-bulles holographiques au survol.
   ============================================================ */
function SkillsOrbitCanvas({
  theme,
  items,
  layouts,
  ringCountFactor,
  hoveredId,
  setHoveredId,
  collapsing,
  flash,
  isMobile,
  displayedTab,
  isDark
}: {
  theme: { accent: string };
  items: SkillItem[];
  layouts: OrbitLayout[];
  ringCountFactor: number;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  collapsing: boolean;
  flash: boolean;
  isMobile: boolean;
  displayedTab: TabKey;
  isDark: boolean;
}) {
  const mouse = useMousePosition();
  const scroll = useScrollDepth();
  const universe = getUniverse(isDark);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        // hauteur garantie : vh + fallback en px pour éviter tout
        // écrasement à 0px qui rendrait le canvas invisible
        height: isMobile ? '60vh' : '75vh',
        minHeight: isMobile ? '420px' : '560px',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
    >
      <Canvas
        camera={{ position: [0, 1.1, 9], fov: 52 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <OrbitCameraRig mouse={mouse} scroll={scroll} pulsing={collapsing || flash} />
        {/* Moins de particules en light mode : plus visibles/denses sur fond clair */}
        <OrbitParticleLayer count={isMobile ? 25 : isDark ? 60 : 40} accent={theme.accent} spread={20} speed={0.01} converge={collapsing || flash} />
        <OrbitParticleLayer count={isMobile ? 20 : isDark ? 50 : 32} accent={theme.accent} spread={9} speed={0.025} converge={collapsing || flash} />
        <OrbitParticleLayer count={isMobile ? 12 : isDark ? 30 : 20} accent={theme.accent} spread={4} speed={0.05} converge={collapsing || flash} />
        <SkillOrbitCore accent={theme.accent} pulsing={collapsing || flash} />
        {items.map((item, index) => (
          /* item.id est "group-rawId" => unique globalement, y compris
             quand plusieurs tables partagent le même id numérique */
          <SkillNode
            key={`${displayedTab}-${item.id}`}
            item={item}
            index={index}
            layout={layouts[index]}
            accent={universe[item.group].accent}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            collapsing={collapsing}
            ringCountFactor={ringCountFactor}
            isDark={isDark}
          />
        ))}
      </Canvas>
    </div>
  );
}

/* ============================================================
   FALLBACK STATIQUE (prefers-reduced-motion)
   ============================================================ */
function ReducedMotionSkillsFallback({ items, isDark }: { items: SkillItem[]; isDark: boolean }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const universe = getUniverse(isDark);

  return (
    <div style={{ position: 'relative', zIndex: 2, padding: '20px 0 40px', display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
      {items.map((item) => {
        const accent = universe[item.group].accent;
        const isHovered = hoveredId === item.id;
        return (
          <div
            key={item.id}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              width: 160,
              padding: '12px 14px',
              borderRadius: 12,
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${isHovered ? accent : accent + '55'}`,
              color: 'var(--color-text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transform: isHovered ? 'translateY(-3px) scale(1.04)' : 'none',
              boxShadow: isHovered ? `0 0 20px ${accent}55` : 'none',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease'
            }}
          >
            {item.iconUrl ? (
              <img src={item.iconUrl} alt={item.name} style={{ width: 24, height: 24, objectFit: 'contain' }} />
            ) : (
              <MdImage color="#94a3b8" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              {isHovered ? (
                <CircularLevel percentage={item.level} accent={accent} size={26} isDark={isDark} />
              ) : (
                <div style={{ fontSize: 10, color: accent }}>{item.level}%</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */
export default function SkillsContent() {
  const { theme: appTheme } = useTheme();
  const isDark = appTheme === 'dark';

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [displayedTab, setDisplayedTab] = useState<TabKey>('all');
  const [collapsing, setCollapsing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

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
      // ⚠️ FIX PRINCIPAL : AOS calcule les positions de déclenchement
      // ("trigger offsets") au montage, AVANT que les données async
      // n'arrivent. Comme les données changent la hauteur de la page,
      // les offsets d'AOS deviennent obsolètes et certains blocs
      // (comme la zone du canvas orbital) restent bloqués à
      // opacity:0 pour toujours -> ils ne s'affichent jamais.
      // On force donc un recalcul juste après le chargement.
      window.requestAnimationFrame(() => {
        AOS.refresh();
      });
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
  const universe = getUniverse(isDark);
  const theme = universe[activeTab];

  const iconOf = (item: any) => getStorageUrl(item.icon);
  // Extraction du niveau en tenant compte du VRAI modèle de données :
  // - Framework  -> proficiency (pas "level")
  // - Database   -> level
  // - Tool       -> level
  const levelFrom = (raw: any, group: SkillGroup) => {
    const source = group === 'frameworks' ? raw.proficiency : raw.level;
    const num = Number(String(source ?? '0').replace('%', '').trim());
    return isNaN(num) ? 50 : clampPct(num);
  };

  // Badge : Framework -> category, Database -> type, Tool -> category
  const badgeFrom = (raw: any, group: SkillGroup) => {
    if (group === 'databases') return raw.type;
    return raw.category;
  };

  const toSkillItem = (raw: any, group: SkillGroup): SkillItem => ({
    id: `${group}-${raw.id ?? raw.name}`,
    name: raw.name,
    badge: badgeFrom(raw, group),
    iconUrl: iconOf(raw),
    level: levelFrom(raw, group),
    group
  });

  const items3D: SkillItem[] = useMemo(() => {
    let base: SkillItem[] = [];
    if (displayedTab === 'all' || displayedTab === 'frameworks') {
      base = base.concat(filteredFrameworks.map((f: any) => toSkillItem(f, 'frameworks')));
    }
    if (displayedTab === 'all' || displayedTab === 'databases') {
      base = base.concat(filteredDatabases.map((d: any) => toSkillItem(d, 'databases')));
    }
    if (displayedTab === 'all' || displayedTab === 'tools') {
      base = base.concat(filteredTools.map((tl: any) => toSkillItem(tl, 'tools')));
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedTab, filteredFrameworks, filteredDatabases, filteredTools]);

  // Chaque fois que la liste de compétences affichée change (recherche,
  // changement d'onglet), la hauteur de page peut bouger -> on redonne
  // aussi un coup de refresh à AOS pour rester cohérent.
  useEffect(() => {
    if (!loading) {
      window.requestAnimationFrame(() => AOS.refresh());
    }
  }, [loading, items3D.length]);

  const layouts = useOrbitLayout(items3D.length, isMobile);
  const ringCountFactor = layouts.length ? Math.min(1, new Set(layouts.map((l) => l.ring)).size / 3) : 0;

  const changeTab = (next: TabKey) => {
    if (next === activeTab || collapsing) return;
    setActiveTab(next);
    setCollapsing(true);
    window.setTimeout(() => {
      setFlash(true);
      setDisplayedTab(next);
      setCollapsing(false);
    }, 420);
    window.setTimeout(() => setFlash(false), 420 + 550);
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: isDark ? '#020617' : 'var(--color-bg)',
        paddingTop: '80px',
        paddingBottom: '60px',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Fond décoratif en arrière-plan (reste fixed, léger, ne gêne pas la lecture) */}
      {prefersReducedMotion ? (
        <StaticBackground accent={theme.accent} />
      ) : (
        <LabBackground3D activeTab={activeTab} isMobile={isMobile} isDark={isDark} />
      )}

      <div className="container-fluid position-relative py-4 px-4 px-lg-5" style={{ zIndex: 2, color: 'var(--color-text-main)' }}>
        <div className="row align-items-center mb-5 g-4" data-aos="fade-up">
          <div className="col-lg-7 text-start">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3"
              style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${theme.accent}55`, transition: 'border-color 0.4s ease' }}
            >
              <MdCode style={{ color: theme.accent }} />
              <span className="small text-uppercase fw-semibold" style={{ color: theme.accent, letterSpacing: '2px' }}>
                Laboratoire Technologique
              </span>
            </div>
            <h2 className="fw-bold display-5 mb-3" style={{ color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>
              Mes <span style={{ color: theme.accent, transition: 'color 0.4s ease' }}>Compétences</span>
            </h2>
            <p className="lead fs-6 mb-4" style={{ color: 'var(--color-text-muted)', maxWidth: '650px' }}>
              Explorez les technologies, frameworks, bases de données et outils que j'utilise pour concevoir des applications web et mobiles performantes — organisés comme trois univers d'un même stack.
            </p>

            <div className="row g-3 mt-2" style={{ maxWidth: '680px' }}>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="100">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdLightbulb style={{ color: theme.accent }} className="fs-5" />
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--color-text-main)' }}>Maîtrise & Évolution</h6>
                  </div>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                    Des langages fondamentaux aux frameworks modernes évalués selon des niveaux d'expertise continus.
                  </p>
                </div>
              </div>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="200">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MdRocket style={{ color: isDark ? '#22c55e' : '#15803d' }} className="fs-5" />
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--color-text-main)' }}>DevOps & Outils</h6>
                  </div>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
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
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
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

        <div className="row justify-content-center mb-2 g-3" data-aos="fade-up" data-aos-delay="100">
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="input-group shadow-sm"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1px solid ${theme.accent}55`,
                backgroundColor: 'var(--color-surface)',
                transition: 'border-color 0.4s ease'
              }}
            >
              <span className="input-group-text border-0 bg-transparent ps-3" style={{ color: 'var(--color-text-muted)' }}>
                <MdSearch size={22} />
              </span>
              <input
                type="text"
                className="form-control shadow-none border-0 py-3 bg-transparent"
                placeholder="Rechercher une technologie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-7 d-flex justify-content-center justify-content-md-start align-items-center gap-2 flex-wrap">
            {(['all', 'frameworks', 'databases', 'tools'] as TabKey[]).map((key) => {
              const t = universe[key];
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
                  onClick={() => changeTab(key)}
                  className="btn fw-bold px-4 py-0 shadow-sm"
                  style={{
                    backgroundColor: isActive ? t.accent : 'var(--color-surface)',
                    color: isActive ? (isDark ? '#020617' : '#ffffff') : 'var(--color-text-main)',
                    borderRadius: '12px',
                    border: `1px solid ${isActive ? t.accent : 'var(--color-border)'}`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {labelMap[key]}
                </button>
              );
            })}
          </div>
        </div>

        {/*
          ============================================================
          ZONE DES COMPÉTENCES — dans le flux normal de la page,
          en dessous du texte et de la barre de recherche.
          ⚠️ PAS de data-aos ici : c'est ce qui bloquait
          l'affichage (voir le fix dans fetchAllData / useEffect
          plus haut). Le fade-in est géré directement en CSS pour
          rester fiable, sans dépendre du recalcul de scroll d'AOS.
          ============================================================
        */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: theme.accent }}></div>
            <p className="mt-3 fw-semibold" style={{ color: 'var(--color-text-main)' }}>Chargement de vos compétences...</p>
          </div>
        ) : totalCount === 0 ? (
          <div
            className="text-center py-5 card border-0 shadow-sm p-5"
            style={{ borderRadius: '20px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <h4 className="fw-semibold" style={{ color: 'var(--color-text-main)' }}>Aucun résultat trouvé pour votre recherche.</h4>
          </div>
        ) : prefersReducedMotion ? (
          <ReducedMotionSkillsFallback items={items3D} isDark={isDark} />
        ) : (
          <div
            style={{
              position: 'relative',
              opacity: 1,
              animation: 'skillsFadeIn 0.6s ease-out'
            }}
          >
            <style>{`
              @keyframes skillsFadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <SkillsOrbitCanvas
              theme={theme}
              items={items3D}
              layouts={layouts}
              ringCountFactor={ringCountFactor}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              collapsing={collapsing}
              flash={flash}
              isMobile={isMobile}
              displayedTab={displayedTab}
              isDark={isDark}
            />
            <OrbitPortalFlash active={flash} accent={theme.accent} />
          </div>
        )}
      </div>
    </div>
  );
}