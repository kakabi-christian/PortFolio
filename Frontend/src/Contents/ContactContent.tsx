// src/components/ContactContent.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
// @ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaGithub,
  FaLinkedin,
  FaPaperPlane
} from 'react-icons/fa';
import { ContactService } from '../Services/ContactService';

/* ============================================================
   FOND 3D — Scène animée en arrière-plan (React Three Fiber)
   Formes sur le thème de la communication :
   enveloppes, avions en papier, bulles de message.
   ============================================================ */

type ShapeType = 'envelope' | 'paperplane' | 'bubble';

// --- Silhouettes 2D (extrudées ensuite en légers volumes wireframe) ---

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
  // petite pointe (queue de la bulle)
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
  const meshRef = useRef<any>(null);

  // La géométrie est construite une seule fois par type de forme
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
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = t * speed * 0.3;
    meshRef.current.rotation.y = t * speed * 0.5;
    meshRef.current.position.y = position[1] + Math.sin(t * speed) * 0.4;
  });

  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshBasicMaterial color={color} wireframe transparent opacity={0.28} />
    </mesh>
  );
}

function ParallaxRig({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<any>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += (mouse.current.x * 0.15 - groupRef.current.rotation.y) * 0.02;
    groupRef.current.rotation.x += (-mouse.current.y * 0.1 - groupRef.current.rotation.x) * 0.02;
  });

  return <group ref={groupRef}>{children}</group>;
}

function ContactBackground3D() {
  return (
    <div
      style={{
        // "fixed" plutôt que "absolute" : la page a maintenant plusieurs
        // écrans de contenu, le fond doit rester derrière tout le scroll.
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]}>
        <ParallaxRig>
          <FloatingShape position={[-4, 2, -2]} type="envelope" speed={0.5} color="#60a5fa" />
          <FloatingShape position={[4.5, -1.5, -3]} type="paperplane" speed={0.65} color="#3b82f6" />
          <FloatingShape position={[2.5, 2.8, -4]} type="bubble" speed={0.45} color="#93c5fd" />
          <FloatingShape position={[-3.5, -2.5, -3]} type="envelope" speed={0.55} color="#2563eb" />
          <FloatingShape position={[0, -3.2, -5]} type="paperplane" speed={0.35} color="#38bdf8" />
          <FloatingShape position={[5.2, 2.5, -6]} type="bubble" speed={0.4} color="#1d4ed8" />
        </ParallaxRig>
      </Canvas>
    </div>
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

  const faqs = [
    {
      q: "Sous quel délai reçois-tu une réponse ?",
      a: "En général sous 24 à 48h, un peu plus le week-end."
    },
    {
      q: "Es-tu disponible pour un stage ou une alternance ?",
      a: "Oui, je suis actuellement à la recherche d'opportunités en développement web full-stack."
    },
    {
      q: "Travailles-tu aussi sur des projets freelance ?",
      a: "Ponctuellement, selon le sujet et mon planning académique. N'hésite pas à m'en parler."
    }
  ];

  return (
    <div
      className="position-relative"
      style={{ backgroundColor: 'var(--color-bg)', overflow: 'hidden', paddingTop: '80px', paddingBottom: '60px' }}
    >
      {/* Fond 3D interactif avec Three.js */}
      <ContactBackground3D />

      <div className="container position-relative py-4" style={{ zIndex: 1, maxWidth: '900px' }}>

        {/* En-tête */}
        <div className="text-center mb-5" data-aos="fade-up">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <FaEnvelope style={{ color: 'var(--color-primary)' }} />
            <span className="small text-uppercase fw-semibold" style={{ color: 'var(--color-primary)', letterSpacing: '2px' }}>
              Contact
            </span>
          </div>
          <h2 className="fw-bold display-5 mb-3" style={{ color: 'var(--color-text-main)' }}>
            Discutons de <span style={{ color: 'var(--color-primary)' }}>votre projet</span>
          </h2>
          <p className="lead fs-6 mx-auto" style={{ color: 'var(--color-text-muted)', maxWidth: '600px' }}>
            Une idée, une question, une opportunité de stage ou simplement l'envie d'échanger ? Écrivez-moi, je réponds à chaque message.
          </p>
        </div>

        {/* Infos de contact rapides */}
        <div className="row g-3 mb-5">
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="100">
            <div className="p-3 rounded-3 h-100 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <FaMapMarkerAlt className="fs-4 mb-2" style={{ color: 'var(--color-danger)' }} />
              <p className="small mb-0" style={{ color: 'var(--color-text-main)' }}>Village-Elf / Akwa, Douala — Cameroun</p>
            </div>
          </div>
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="200">
            <div className="p-3 rounded-3 h-100 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <FaPhoneAlt className="fs-4 mb-2" style={{ color: 'var(--color-success)' }} />
              <p className="small mb-0" style={{ color: 'var(--color-text-main)' }}>+237 658 78 84 48</p>
            </div>
          </div>
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="300">
            <div className="p-3 rounded-3 h-100 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <FaClock className="fs-4 mb-2" style={{ color: 'var(--color-primary)' }} />
              <p className="small mb-0" style={{ color: 'var(--color-text-main)' }}>Réponse sous 24-48h</p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div
          className="p-3 p-lg-4 rounded-4 mb-5 mx-auto"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', maxWidth: '560px' }}
          data-aos="fade-up"
        >
          <h3 className="fw-bold fs-4 mb-4 d-flex align-items-center gap-2" style={{ color: 'var(--color-primary)' }}>
            <FaPaperPlane /> Envoyez-moi un message
          </h3>

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

            {status === 'success' && <p style={{ color: 'var(--color-success)', textAlign: 'center' }} data-aos="fade-in">Message envoyé avec succès !</p>}
            {status === 'error' && <p style={{ color: 'var(--color-danger)', textAlign: 'center' }} data-aos="fade-in">Une erreur est survenue.</p>}
          </form>
        </div>

        {/* Réseaux sociaux */}
        <div className="text-center mb-5" data-aos="fade-up">
          <p className="small mb-3" style={{ color: 'var(--color-text-muted)' }}>Ou retrouvez-moi directement sur :</p>
          <div className="d-flex justify-content-center gap-3">
            <a
              href="https://github.com/kakabi-christian"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '44px', height: '44px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
              title="GitHub"
            >
              <FaGithub size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/christian-kakabi-025373374"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '44px', height: '44px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
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

// Styles basés sur votre charte
const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: '#ffffff',
  padding: '12px',
  borderRadius: '8px',
  outline: 'none',
  width: '100%'
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontWeight: 'bold',
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.3s',
  width: '100%'
};