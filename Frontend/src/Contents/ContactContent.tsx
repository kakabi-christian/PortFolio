import React, { useState, useEffect, useRef, useMemo } from 'react';

// Déclaration de type pour contourner l'absence de types officiels dans 'aos'
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaGithub,
  FaLinkedin,
  FaPaperPlane,
  FaLightbulb,
  FaRocket
} from 'react-icons/fa';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring
} from 'framer-motion';
import { ContactService } from '../Services/ContactService';
import photo from '../assets/ContactPeople.png';

type ShapeType = 'envelope' | 'paperplane' | 'bubble';
// type GeometryKind = 'icosahedron' | 'torus' | 'octahedron';

/* ============================================================
   THEME — mêmes couleurs que HomeContent / SkillsContent
   ============================================================ */
const ACCENT = '#38bdf8';

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
   FOND 3D — Formes de communication & Noyau immersif unifié
   ============================================================ */

function buildEnvelopeShape(): THREE.Shape {
  const w = 1.5;
  const h = 1;
  const flap = 0.45;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2 - flap);
  shape.lineTo(0, h / 2 + flap * 0.4);
  shape.lineTo(-w / 2, h / 2 - flap);
  shape.lineTo(-w / 2, -h / 2);
  return shape;
}

function buildPaperPlaneShape(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.7);
  shape.lineTo(-0.6, -0.55);
  shape.lineTo(0, -0.2);
  shape.lineTo(0.6, -0.55);
  shape.lineTo(0, 0.7);
  return shape;
}

function buildBubbleShape(): THREE.Shape {
  const w = 1.3;
  const h = 0.9;
  const r = 0.22;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 3);
  shape.lineTo(-w / 2 - 0.3, -h / 2 - 0.15);
  shape.lineTo(-w / 2 + 0.25, -h / 3 + 0.05);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return shape;
}

function getShapeBuilder(type: ShapeType) {
  switch (type) {
    case 'envelope':
      return buildEnvelopeShape;
    case 'paperplane':
      return buildPaperPlaneShape;
    case 'bubble':
      return buildBubbleShape;
  }
}

function FloatingShape({
  position,
  type,
  speed,
  color
}: {
  position: [number, number, number];
  type: ShapeType;
  speed: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const current = useRef(new THREE.Color(color));
  const target = useMemo(() => new THREE.Color(color), [color]);

  const geometry = useMemo(() => {
    const shape = getShapeBuilder(type)();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1
    });
  }, [type]);

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
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
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

function ContactBackground3D() {
  const isMobile = useIsMobile();
  const mouse = useMousePosition();
  const scroll = useScrollDepth();
  const accent = ACCENT;

  const shapeData = useMemo<Array<{ pos: [number, number, number]; type: ShapeType; speed: number; color: string }>>(() => [
    { pos: [-4, 2, -2], type: 'envelope', speed: 0.5, color: '#60a5fa' },
    { pos: [4.5, -1.5, -3], type: 'paperplane', speed: 0.65, color: '#3b82f6' },
    { pos: [2.5, 2.8, -4], type: 'bubble', speed: 0.45, color: '#93c5fd' },
    { pos: [-3.5, -2.5, -3], type: 'envelope', speed: 0.55, color: '#2563eb' },
    { pos: [0, -3.2, -5], type: 'paperplane', speed: 0.35, color: '#38bdf8' },
    { pos: [5.2, 2.5, -6], type: 'bubble', speed: 0.4, color: '#1d4ed8' }
  ], []);

  const visibleShapes = isMobile ? shapeData.slice(0, 3) : shapeData;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={isMobile ? [1, 1] : [1, 1.5]}>
        <SceneRig mouse={mouse} scroll={scroll}>
          <SkillCore accent={accent} />
          <Particles count={isMobile ? 50 : 130} accent={accent} />
          {visibleShapes.map((item, i) => (
            <FloatingShape
              key={i}
              position={item.pos}
              type={item.type}
              speed={item.speed}
              color={item.color}
            />
          ))}
          {!isMobile && <ConnectionLines points={visibleShapes.map(s => s.pos)} accent={accent} />}
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

export default function ContactContent() {
  const [formData, setFormData] = useState({
    sender_name: '',
    sender_email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await ContactService.store(formData);
      setStatus('success');
      setFormData({ sender_name: '', sender_email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div
      className="position-relative"
      style={{ backgroundColor: '#020617', overflow: 'hidden', paddingTop: '80px', paddingBottom: '60px', minHeight: '100vh' }}
    >
      {/* Fond 3D interactif unifié avec Three.js */}
      <ContactBackground3D />

      <div className="container-fluid position-relative py-4 px-4 px-lg-5" style={{ zIndex: 1, color: '#ffffff' }}>

        {/* En-tête : Texte aligné à gauche (start), Image agrandie et alignée à droite (end) */}
        <div className="row align-items-center mb-5 g-4" data-aos="fade-up">
          <div className="col-lg-7 text-start">
            <div
              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: `1px solid ${ACCENT}55` }}
            >
              <FaEnvelope style={{ color: ACCENT }} />
              <span className="small text-uppercase fw-semibold" style={{ color: ACCENT, letterSpacing: '2px' }}>
                Contact
              </span>
            </div>
            <h2 className="fw-bold display-5 mb-3 text-white" style={{ letterSpacing: '-0.5px' }}>
              Discutons de <span style={{ color: ACCENT }}>votre projet</span>
            </h2>
            <p className="lead fs-6 mb-4" style={{ color: '#cbd5e1', maxWidth: '650px' }}>
              Une idée, une question, une opportunité de stage ou simplement l'envie d'échanger ? Écrivez-moi, je réponds à chaque message.
            </p>

            {/* Blocs explicatifs intégrés pour clarifier la démarche */}
            <div className="row g-3 mt-2" style={{ maxWidth: '680px' }}>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="100">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FaLightbulb style={{ color: ACCENT }} className="fs-5" />
                    <h6 className="fw-bold mb-0 text-white">Idée ou Collaboration</h6>
                  </div>
                  <p className="small mb-0" style={{ color: '#94a3b8' }}>
                    Vous avez un projet web/mobile à concrétiser ou besoin d'expertise technique full-stack ? Exposons vos objectifs.
                  </p>
                </div>
              </div>
              <div className="col-sm-6" data-aos="fade-up" data-aos-delay="200">
                <div className="p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FaRocket style={{ color: '#22c55e' }} className="fs-5" />
                    <h6 className="fw-bold mb-0 text-white">Opportunités & Stages</h6>
                  </div>
                  <p className="small mb-0" style={{ color: '#94a3b8' }}>
                    En quête d'un développeur passionné rigoureux et autonome ? Discutons de votre intégration au sein de votre équipe.
                  </p>
                </div>
              </div>
            </div>

          </div>
          
          <div className="col-lg-5 text-end d-flex justify-content-lg-end justify-content-center">
            <div className="position-relative d-inline-block">
              {/* Effet d'arrière-plan lumineux élargi */}
              <div
                className="position-absolute top-50 start-50 translate-middle rounded-circle"
                style={{
                  width: '380px',
                  height: '380px',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(34, 197, 94, 0.05) 70%)',
                  zIndex: 0,
                  filter: 'blur(35px)'
                }}
              ></div>

              {/* Carte photo avec effet 3D Tilt et dimensions augmentées */}
              <PhotoTiltCard>
                <div
                  className="p-3 rounded-4 position-relative shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '460px'
                  }}
                >
                  <img
                    src={photo}
                    alt="Contact Support"
                    className="img-fluid rounded-3"
                    style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover' }}
                  />
                </div>
              </PhotoTiltCard>
            </div>
          </div>
        </div>

        {/* Infos de contact rapides */}
        <div className="row g-3 mb-5">
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="100">
            <div className="p-3 rounded-3 h-100 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <FaMapMarkerAlt className="fs-4 mb-2" style={{ color: '#ef4444' }} />
              <p className="small mb-0 text-white">Village-Elf,  /Douala - Cameroun</p>
            </div>
          </div>
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="200">
            <div className="p-3 rounded-3 h-100 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <FaPhoneAlt className="fs-4 mb-2" style={{ color: '#22c55e' }} />
              <p className="small mb-0 text-white">+237 658 78 84 48</p>
            </div>
          </div>
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="300">
            <div className="p-3 rounded-3 h-100 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <FaClock className="fs-4 mb-2" style={{ color: ACCENT }} />
              <p className="small mb-0 text-white">Réponse sous 24-48h</p>
            </div>
          </div>
        </div>

        {/* Formulaire (en bas) */}
        <div
          className="p-3 p-lg-4 rounded-4 mb-5 mx-auto"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', maxWidth: '560px' }}
          data-aos="fade-up"
        >
          <h3 className="fw-bold fs-4 mb-4 d-flex align-items-center gap-2" style={{ color: ACCENT }}>
            <FaPaperPlane /> Envoyez-moi un message
          </h3>
          <p className="small mb-4" style={{ color: '#94a3b8' }}>
            Remplissez les champs ci-dessous pour m'adresser directement votre requête. Je m'engage à l'analyser et à vous revenir rapidement.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="row g-2">
              <div className="col-md-6" data-aos="fade-right" data-aos-delay="100">
                <input
                  name="sender_name" placeholder="Votre Nom" required
                  value={formData.sender_name} onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div className="col-md-6" data-aos="fade-right" data-aos-delay="150">
                <input
                  name="sender_email" type="email" placeholder="Votre Email" required
                  value={formData.sender_email} onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>
            <div data-aos="fade-right" data-aos-delay="200">
              <input
                name="subject" placeholder="Sujet" required
                value={formData.subject} onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div data-aos="fade-right" data-aos-delay="250">
              <textarea
                name="message" placeholder="Votre message..." required rows={3}
                value={formData.message} onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div data-aos="zoom-in" data-aos-delay="300">
              <button
                type="submit" disabled={status === 'sending'}
                style={buttonStyle}
              >
                {status === 'sending' ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </div>

            {status === 'success' && <p style={{ color: '#22c55e', textAlign: 'center' }} data-aos="fade-in">Message envoyé avec succès !</p>}
            {status === 'error' && <p style={{ color: '#ef4444', textAlign: 'center' }} data-aos="fade-in">Une erreur est survenue.</p>}
          </form>
        </div>

        {/* Réseaux sociaux */}
        <div className="text-center mb-5" data-aos="fade-up">
          <p className="small mb-3" style={{ color: '#94a3b8' }}>Ou retrouvez-moi directement sur :</p>
          <div className="d-flex justify-content-center gap-3">
            <a
              href="https://github.com/kakabi-christian"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '44px', height: '44px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: ACCENT, border: '1px solid rgba(255, 255, 255, 0.15)' }}
              title="GitHub"
            >
              <FaGithub size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/christian-kakabi-025373374"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '44px', height: '44px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: ACCENT, border: '1px solid rgba(255, 255, 255, 0.15)' }}
              title="LinkedIn"
            >
              <FaLinkedin size={20} />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

// Styles basés sur le thème sombre unifié
const inputStyle: React.CSSProperties = {
  backgroundColor: '#020617',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '8px',
  outline: 'none',
  width: '100%'
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: ACCENT,
  color: '#020617',
  fontWeight: 'bold',
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.3s',
  width: '100%'
};