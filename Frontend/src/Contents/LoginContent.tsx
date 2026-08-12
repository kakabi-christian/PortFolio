import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdEmail, MdLock, MdArrowForward, MdErrorOutline, MdCheckCircleOutline } from "react-icons/md";
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { authService } from "../Services/AuthService";
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ============================================================
   THEME — mêmes couleurs que Home / Skills / Contact
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
   FOND 3D — VISAGE CYBORG / HUD HIGH-TECH (React Three Fiber)
   ============================================================ */
function CyborgHeadHUD({
  position,
  rotationSpeed,
  color
}: {
  position: [number, number, number];
  rotationSpeed: number;
  color: string;
}) {
  const groupRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * rotationSpeed;
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.2;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Structure crânienne / Casque Cyborg abstrait (Icosaèdre étiré / Capsule) */}
      <mesh position={[0, 0.2, 0]}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
      </mesh>

      {/* Visière / Yeux lumineux HUD */}
      <mesh position={[0, 0.25, 0.85]}>
        <boxGeometry args={[1.1, 0.2, 0.2]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
      </mesh>

      {/* Anneau de données holographique autour du cyborg */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1.6, 0.03, 16, 60]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
      </mesh>

      {/* Module de la mâchoire / Nuage de points techniques */}
      <mesh position={[0, -0.6, 0]}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
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

function LoginBackground3D() {
  const isMobile = useIsMobile();
  const mouse = useMousePosition();
  const scroll = useScrollDepth();
  const accent = ACCENT;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={isMobile ? [1, 1] : [1, 1.5]}>
        <SceneRig mouse={mouse} scroll={scroll}>
          {/* Cyborgs HUD sur les côtés uniquement — plus de noyau central derrière la carte */}
          <CyborgHeadHUD position={[-4, 1.5, -4]} rotationSpeed={-0.3} color="#22c55e" />
          <CyborgHeadHUD position={[4, -1.5, -4]} rotationSpeed={0.5} color="#60a5fa" />
          <Particles count={isMobile ? 50 : 130} accent={accent} />
        </SceneRig>
      </Canvas>
    </div>
  );
}

export default function LoginContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });

    if (location.state?.message) {
      setMessage({ type: "success", text: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await authService.login(formData);
      if (response.user.role === 'admin') {
        navigate("/admin/profile");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403 && data?.needs_verification) {
        navigate("/verify-otp", { 
          state: { email: formData.email, message: data.message } 
        });
      } else {
        const errorMsg = data?.message || "Identifiants incorrects ou problème réseau.";
        setMessage({ type: "error", text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper d-flex align-items-center justify-content-center position-relative overflow-hidden" 
         style={{ minHeight: '100vh', backgroundColor: '#020617' }}>
      
      {/* Fond 3D Interactif — Visages Cyborgs & Particules */}
      <LoginBackground3D />

      {/* Éléments de lueur d'ambiance */}
      <div className="position-absolute top-50 start-50 translate-middle rounded-circle" style={{ width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }}></div>

      {/* Carte de connexion compacte (largeur et longueur réduites) */}
      <div className="login-card p-3 p-md-4 shadow-2xl rounded-4 border-0 position-relative" 
           data-aos="zoom-in-up"
           style={{ 
             maxWidth: '380px', 
             width: '85%', 
             backgroundColor: 'rgba(255, 255, 255, 0.05)',
             border: '1px solid rgba(255, 255, 255, 0.15)',
             zIndex: 1,
             boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
           }}>
        
        <div className="text-center mb-3" data-aos="fade-down" data-aos-delay="200">
          <h2 className="fw-bold fs-4 mb-1 text-white">Bon retour !</h2>
          <p className="small mb-0" style={{ color: '#94a3b8' }}>
            Espace admin <span className="fw-bold" style={{ color: ACCENT }}>Portfolio</span>
          </p>
        </div>

        {message && (
          <div className="d-flex align-items-center p-2 mb-3 rounded-3" 
                data-aos="fade"
                style={{ 
                  backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderLeft: `4px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
                  color: message.type === 'success' ? '#22c55e' : '#ef4444'
                }}>
            <span className="fs-5 me-2">
              {message.type === "success" ? <MdCheckCircleOutline /> : <MdErrorOutline />}
            </span>
            <span className="small fw-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="mb-3" data-aos="fade-up" data-aos-delay="300">
            <label htmlFor="login-email" className="form-label small fw-bold mb-1" style={{ color: '#94a3b8' }}>Adresse Email</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text border-0 px-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}><MdEmail /></span>
              <input 
                id="login-email"
                type="email" 
                className="form-control border-0 fs-6 shadow-none"
                style={{ 
                  borderRadius: '0 8px 8px 0', 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                  color: '#ffffff',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${ACCENT}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                name="email" 
                placeholder="votre@email.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="mb-3" data-aos="fade-up" data-aos-delay="400">
            <div className="d-flex justify-content-between mb-1">
              <label htmlFor="login-password" className="form-label small fw-bold mb-0" style={{ color: '#94a3b8' }}>Mot de passe</label>
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text border-0 px-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}><MdLock /></span>
              <input 
                id="login-password"
                type="password" 
                className="form-control border-0 fs-6 shadow-none"
                style={{ 
                  borderRadius: '0 8px 8px 0', 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                  color: '#ffffff',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${ACCENT}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                name="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="500">
            <button type="submit" 
                    className="btn w-100 mt-2 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
                    disabled={loading}
                    style={{ 
                      backgroundColor: ACCENT, 
                      color: '#0f172a', 
                      border: 'none',
                      fontSize: '0.9rem',
                      height: '44px',
                      minHeight: '44px',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" style={{ width: '1rem', height: '1rem' }}></span>
              ) : (
                <>Se connecter <MdArrowForward /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}