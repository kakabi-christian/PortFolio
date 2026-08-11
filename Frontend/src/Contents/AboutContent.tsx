import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaGraduationCap, FaBriefcase, FaUserCheck, FaMapMarkerAlt, FaRocket, FaGamepad, FaPalette } from 'react-icons/fa';

// Déclaration de type pour contourner l'absence de types officiels dans 'aos'
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

import photoVeste from '../assets/photo veste.jpeg';

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
   FOND 3D — Scène immersive interactive (identique aux autres pages)
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

function AboutBackground3D() {
  const isMobile = useIsMobile();
  const mouse = useMousePosition();
  const scroll = useScrollDepth();
  const accent = '#38bdf8';

  const shapePositions = useMemo<[number, number, number][]>(
    () => [
      [-5, 2, -3],
      [5, -2, -4],
      [3, 3, -5],
      [-4, -3, -3]
    ],
    []
  );
  const visibleShapes = isMobile ? shapePositions.slice(0, 2) : shapePositions;
  const geometries: GeometryKind[] = ['icosahedron', 'torus', 'octahedron', 'octahedron'];

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
              color={i % 2 === 0 ? accent : '#22c55e'}
            />
          ))}
          {!isMobile && <ConnectionLines points={visibleShapes} accent={accent} />}
        </SceneRig>
      </Canvas>
    </div>
  );
}

export default function AboutContent() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });
  }, []);

  return (
    <section className="py-5 text-light position-relative overflow-hidden" style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
      
      {/* Fond 3D Interactif Three.js unifié */}
      <AboutBackground3D />

      {/* Éléments d'arrière-plan lumineux subtils */}
      <div className="position-absolute top-0 start-50 translate-middle-x rounded-circle" style={{ width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div className="position-absolute bottom-0 end-0 rounded-circle" style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(34, 197, 94, 0.04) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }}></div>

      <div className="container py-4 position-relative" style={{ zIndex: 1 }}>
        
        {/* En-tête de la page */}
        <div className="text-center mb-5" data-aos="fade-up">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginTop: '20px' }}>
            <FaRocket style={{ color: 'var(--color-primary)' }} />
            <span className="small text-uppercase tracking-wider fw-semibold" style={{ color: 'var(--color-primary)', letterSpacing: '2px' }}>Portfolio Officiel</span>
          </div>
          <h2 className="fw-bold display-5 mb-2" style={{ color: 'var(--color-text-main)' }}>
            À propos de <span style={{ color: 'var(--color-primary)', textShadow: '0 0 20px rgba(56, 189, 248, 0.3)' }}>moi</span>
          </h2>
          <div className="mx-auto mb-3" style={{ width: '80px', height: '4px', backgroundColor: 'var(--color-success)', borderRadius: '2px', boxShadow: '0 0 10px var(--color-success)' }}></div>
          <p className="lead fs-6 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '700px' }}>
            Découvrez mon parcours, mes compétences full-stack, mon sens du design UI/UX et ma passion pour l'innovation.
          </p>
        </div>

        {/* Section 1 : Profil et Informations */}
        <div className="row g-4 align-items-center mb-5">
          <div className="col-lg-5 text-center" data-aos="fade-right" data-aos-delay="100">
            <div className="position-relative d-inline-block w-100" style={{ maxWidth: '380px' }}>
              <div 
                className="position-absolute top-50 start-50 translate-middle rounded-4"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(34, 197, 94, 0.2))',
                  zIndex: 0,
                  filter: 'blur(25px)',
                  transform: 'scale(1.08)'
                }}
              ></div>

              <div 
                className="p-3 rounded-4 position-relative overflow-hidden shadow-2xl" 
                style={{ 
                  backgroundColor: 'var(--color-surface)', 
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  zIndex: 1
                }}
              >
                <div className="overflow-hidden rounded-3 position-relative shadow-lg" style={{ minHeight: '420px' }}>
                  <img 
                    src={photoVeste} 
                    alt="Kakabi Christian en veste" 
                    className="img-fluid rounded-3 w-100" 
                    style={{ objectFit: 'cover', maxHeight: '440px', minHeight: '420px', transition: 'transform 0.7s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div className="position-absolute bottom-0 start-0 w-100 p-3 text-center" style={{ background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent)' }}>
                    <span className="badge px-3 py-2 fs-6 shadow" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', fontWeight: 'bold' }}>Kakabi Christian</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7" data-aos="fade-left" data-aos-delay="200">
            <div 
              className="p-4 p-lg-5 rounded-4 h-100 position-relative shadow-2xl" 
              style={{ 
                backgroundColor: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <h3 className="fw-bold fs-4 mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                <FaUserCheck /> Profil & Vision Créative
              </h3>
              <p className="small lh-lg mb-3" style={{ color: 'var(--color-text-main)' }}>
                Je m'appelle <strong style={{ color: 'var(--color-primary)' }}>Kakabi Christian</strong>, étudiant en niveau 3 en informatique (Concepteur et Développeur web Full-stack) à l’<strong style={{ color: 'var(--color-success)' }}>Institut Universitaire de la Côte (IUC)</strong> de Logbessou (Douala). Au quotidien, j'exerce ma passion à travers des technologies de pointe comme <strong style={{ color: 'var(--color-primary)' }}>Laravel et React</strong>.
              </p>
              <p className="small lh-lg mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Alliant mon expertise en <strong style={{ color: '#eab308' }}><FaPalette className="me-1" /> design UI/UX (Figma)</strong> et mon amour pour l’univers immersif des <strong style={{ color: 'var(--color-success)' }}><FaGamepad className="me-1" /> jeux vidéo</strong>, je conçois des interfaces ergonomiques, fluides et esthétiques qui placent l'expérience utilisateur au cœur de chaque projet.
              </p>
              <div className="d-flex align-items-center gap-2 small p-3 rounded-3 mt-4 shadow-sm" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <FaMapMarkerAlt style={{ color: 'var(--color-danger)' }} className="fs-5" />
                <span style={{ color: 'var(--color-text-main)' }}>Village-Elf / Akwa, Douala — Cameroun | +237 658 78 84 48</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 : Parcours Académique Détaillé */}
        <div className="mb-5" data-aos="fade-up" data-aos-delay="300">
          <div 
            className="p-4 p-lg-5 rounded-4 shadow-2xl" 
            style={{ 
              backgroundColor: 'var(--color-surface)', 
              border: '1px solid var(--color-border)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="row align-items-center mb-4">
              <div className="col-lg-7">
                <h3 className="fw-bold fs-4 m-0 d-flex align-items-center gap-2" style={{ color: 'var(--color-success)' }}>
                  <FaGraduationCap /> Parcours Académique & International
                </h3>
              </div>
            </div>
            
            <div className="row g-4">
              {/* Étape 1 */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="350">
                <div 
                  className="p-4 rounded-3 h-100 shadow-sm" 
                  style={{ 
                    backgroundColor: 'var(--color-bg)', 
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span className="badge mb-2 px-2 py-1" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>2023 – 2024 (Première année)</span>
                  <h4 className="fw-bold fs-6 mb-1" style={{ color: 'var(--color-text-main)' }}>Institut Universitaire de la Côte (IUC)</h4>
                  <p className="small mb-2 fw-semibold" style={{ color: 'var(--color-success)' }}>Logbessou, Douala — Technologie de l'Informatique (TI)</p>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                    Réorientation réussie vers le numérique.
                  </p>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="col-md-6" data-aos="fade-up" data-aos-delay="400">
                <div 
                  className="p-4 rounded-3 h-100 shadow-sm" 
                  style={{ 
                    backgroundColor: 'var(--color-bg)', 
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span className="badge mb-2 px-2 py-1" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>2024 – 2025 (Deuxième année)</span>
                  <h4 className="fw-bold fs-6 mb-1" style={{ color: 'var(--color-text-main)' }}>IUC — Programmation et Développement d’Applications Mobiles (PAM)</h4>
                  <p className="small mb-2 fw-semibold" style={{ color: 'var(--color-success)' }}>Logbessou, Douala</p>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                     Obtention du <strong style={{ color: 'var(--color-text-main)' }}>Diplôme d’Études Collégiales (DEC)</strong> attestant de compétences avancées en programmation et technologies mobiles.
                  </p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="col-12" data-aos="fade-up" data-aos-delay="450">
                <div 
                  className="p-4 rounded-3 shadow-sm" 
                  style={{ 
                    backgroundColor: 'var(--color-bg)', 
                    border: '1px solid var(--color-primary)'
                  }}
                >
                  <span className="badge mb-2 px-3 py-1" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', fontWeight: 'bold' }}>2025 – 2026 (Troisième année – En cours)</span>
                  <h4 className="fw-bold fs-6 mb-1" style={{ color: 'var(--color-text-main)' }}>IUC — Concepteur Développeur Web Full-Stack (CDWFS) & Perspective Internationale</h4>
                  <p className="small mb-2 fw-semibold" style={{ color: 'var(--color-primary)' }}>Logbessou, Douala</p>
                  <p className="small mb-0" style={{ color: 'var(--color-text-muted)' }}>
                    Maîtrise quotidienne de la stack <strong style={{ color: 'var(--color-text-main)' }}>Laravel & React</strong>, conception UI/UX sur Figma.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3 : Expérience Professionnelle (Stage Levegi) */}
        <div className="row justify-content-center mb-5" data-aos="fade-up" data-aos-delay="500">
          <div className="col-12">
            <div 
              className="p-4 p-lg-5 rounded-4 shadow-2xl" 
              style={{ 
                backgroundColor: 'var(--color-surface)', 
                border: '1px solid var(--color-border)',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="row align-items-center mb-4">
                <div className="col-lg-7">
                  <h3 className="fw-bold fs-4 m-0 d-flex align-items-center gap-2" style={{ color: '#eab308' }}>
                    <FaBriefcase /> Expérience Professionnelle
                  </h3>
                </div>
              </div>

              <div 
                className="p-4 rounded-3 shadow-sm" 
                style={{ 
                  backgroundColor: 'var(--color-bg)', 
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                  <h4 className="fw-bold fs-6 mb-0" style={{ color: 'var(--color-text-main)' }}>Stage Académique – LEVEGI</h4>
                </div>
                <p className="small mb-2" style={{ color: 'var(--color-text-muted)' }}><FaMapMarkerAlt className="me-1" style={{ color: 'var(--color-danger)' }} /> Akwa, Douala</p>
                <p className="small mb-3" style={{ color: 'var(--color-text-main)' }}>
                  Stage académique de deux mois effectué en vue de l'obtention du DEC. Supervision technique assurée par <strong style={{ color: 'var(--color-text-main)' }}>M. PAGOUEN KAWE Ragil</strong>.
                </p>
                <div className="d-flex flex-wrap gap-2 small">
                  <span className="badge px-3 py-1" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>Programmation Application Mobile (PAM)</span>
                  <span className="badge px-3 py-1" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' }}>UI/UX & Développement</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}