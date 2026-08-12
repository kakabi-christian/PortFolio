import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaArrowRight } from 'react-icons/fa';

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

type GeometryKind = 'icosahedron' | 'torus' | 'octahedron';

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

function HomeBackground3D() {
  const isMobile = useIsMobile();
  const mouse = useMousePosition();
  const scroll = useScrollDepth();
  const accent = '#60a5fa';

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
          <Particles count={isMobile ? 50 : 140} accent={accent} />
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
      {/* Animations CSS injectées pour le curseur clignotant */}
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
      `}</style>

      <div className="home-page-wrapper d-flex align-items-center position-relative" style={{ minHeight: '100vh', paddingTop: '80px', backgroundColor: '#020617', overflow: 'hidden' }}>
        
        {/* Fond 3D interactif amélioré (identique à skillscontent) */}
        <HomeBackground3D />

        <div className="container py-5 position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5">
            
            {/* Colonne de gauche : Texte et Présentation */}
            <div className="col-lg-7" data-aos="fade-right">
              <div className="mb-3">
                <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                  👋 Bienvenue sur mon portfolio
                </span>
              </div>
              
              {/* Le nom s'affiche d'abord en haut (statique) */}
              <h1 className="display-4 fw-bold mb-3" style={{ color: '#ffffff' }}>
                Salut, je suis <span style={{ color: '#60a5fa' }}>Kakabi Christian</span>
              </h1>
              
              {/* Texte dynamique avec effet machine à écrire pour la profession */}
              <h2 className="h4 fw-semibold mb-4" style={{ color: '#94a3b8', minHeight: '35px' }}>
                <span>{currentSubText}</span>
                <span className="cursor-blink" style={{ height: '24px', verticalAlign: 'middle' }}>&nbsp;</span>
              </h2>
              
              <p className="lead mb-4" style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.7' }}>
                Passionné par la conception et le développement d'applications web performantes. 
                Je transforme vos idées en solutions numériques robustes, de l'interface utilisateur jusqu'à l'infrastructure cloud.
              </p>

              {/* Boutons d'action */}
              <div className="d-flex flex-wrap gap-3 mb-4" data-aos="fade-up" data-aos-delay="200">
                <Link 
                  to="/project" 
                  className="btn px-4 py-3 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-lg"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none' }}
                >
                  Explorer mes projets <FaArrowRight />
                </Link>
                
                <Link 
                  to="/contact" 
                  className="btn px-4 py-3 rounded-pill fw-bold d-flex align-items-center gap-2"
                  style={{ backgroundColor: 'transparent', color: '#ffffff', border: '2px solid rgba(255, 255, 255, 0.2)' }}
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
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#60a5fa', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  title="GitHub"
                >
                  <FaGithub size={20} />
                </a>
                <a 
                  href="https://www.linkedin.com/in/christian-kakabi-025373374" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#60a5fa', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                  title="LinkedIn"
                >
                  <FaLinkedin size={20} />
                </a>
              </div>

            </div>

            {/* Colonne de droite : Photo de profil avec effet 3D Tilt interactif & fond lumineux */}
            <div className="col-lg-5 text-center" data-aos="zoom-in" data-aos-delay="300">
              <div className="position-relative d-inline-block">
                
                {/* Effet d'arrière-plan lumineux */}
                <div 
                  className="position-absolute top-50 start-50 translate-middle rounded-circle"
                  style={{ 
                    width: '320px', 
                    height: '320px', 
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(34, 197, 94, 0.05) 70%)',
                    zIndex: 0,
                    filter: 'blur(25px)'
                  }}
                ></div>
                
                {/* Carte photo encapsulée dans le composant de Tilt 3D */}
                <PhotoTiltCard>
                  <div 
                    className="p-3 rounded-4 position-relative shadow-2xl" 
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      zIndex: 1,
                      maxWidth: '360px',
                      margin: '0 auto'
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
      </div>
    </>
  );
}