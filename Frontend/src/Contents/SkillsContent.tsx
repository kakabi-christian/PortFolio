import { useState, useEffect, useRef } from 'react';
import { 
  MdStorage, 
  MdCode, 
  MdBuild, 
  MdSearch,
  MdImage
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';

import { Canvas, useFrame } from '@react-three/fiber';
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useTransform, 
  useSpring 
} from 'framer-motion';

import { toolService } from '../Services/ToolService';
import { frameworkService } from '../Services/FrameworkService';
import { databaseService } from '../Services/DatabaseService';

import type { Tool } from '../Models/Tool';
import type { Framework } from '../Models/Framework';
import type { Database } from '../Models/Database';

/* ============================================================
   FOND 3D — Scène animée en arrière-plan (React Three Fiber)
   ============================================================ */
function FloatingShape({
  position,
  geometry,
  speed,
  color
}: {
  position: [number, number, number];
  geometry: 'icosahedron' | 'torus' | 'octahedron';
  speed: number;
  color: string;
}) {
  const meshRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = t * speed * 0.3;
    meshRef.current.rotation.y = t * speed * 0.5;
    meshRef.current.position.y = position[1] + Math.sin(t * speed) * 0.4;
  });

  return (
    <mesh ref={meshRef} position={position}>
      {geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}
      {geometry === 'torus' && <torusGeometry args={[0.8, 0.28, 16, 100]} />}
      {geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
      <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
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

function SkillsBackground3D() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]}>
        <ParallaxRig>
          <FloatingShape position={[-4, 1.5, -2]} geometry="icosahedron" speed={0.6} color="#60a5fa" />
          <FloatingShape position={[4.5, -1, -3]} geometry="torus" speed={0.4} color="#3b82f6" />
          <FloatingShape position={[2.5, 2.5, -4]} geometry="octahedron" speed={0.8} color="#93c5fd" />
          <FloatingShape position={[-3.5, -2, -3]} geometry="octahedron" speed={0.5} color="#2563eb" />
        </ParallaxRig>
      </Canvas>
    </div>
  );
}

/* ============================================================
   CARTE AVEC EFFET TILT 3D (Framer Motion)
   ============================================================ */
function SkillTiltCard({ children, index }: { children: React.ReactNode; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 200,
    damping: 20
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
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
      initial={{ opacity: 0, y: 40, rotateY: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 800,
        height: '100%'
      }}
    >
      {children}
    </motion.div>
  );
}

export default function SkillsContent() {
  const [activeTab, setActiveTab] = useState<'all' | 'frameworks' | 'databases' | 'tools'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log("🔄 [SkillsContent] Début du chargement des données...");

      const [fwRes, dbRes, toolRes] = await Promise.all([
        frameworkService.getAll(1, '', '', 50),
        databaseService.getAll(1, 50),
        toolService.getAll(1, 50)
      ]);

      console.log("📥 [SkillsContent] Réponse brute Frameworks:", fwRes);
      console.log("📥 [SkillsContent] Réponse brute Databases:", dbRes);
      console.log("📥 [SkillsContent] Réponse brute Tools:", toolRes);

      const extractedFrameworks = fwRes?.data?.data || fwRes?.data || fwRes || [];
      const extractedDatabases = dbRes?.data?.data || dbRes?.data || dbRes || [];
      
      // Sécurisation robuste pour transformer l'objet brut des outils en tableau
      const rawTools = toolRes?.data?.data || toolRes?.data || toolRes || [];
      const extractedTools = Array.isArray(rawTools) 
        ? rawTools 
        : (Array.isArray(rawTools.data) ? rawTools.data : Object.values(rawTools).find(val => Array.isArray(val)) || []);

      console.log("✅ [SkillsContent] Frameworks extraits:", extractedFrameworks);
      console.log("✅ [SkillsContent] Databases extraites:", extractedDatabases);
      console.log("✅ [SkillsContent] Tools extraits (corrigés en tableau):", extractedTools);

      setFrameworks(Array.isArray(extractedFrameworks) ? extractedFrameworks : []);
      setDatabases(Array.isArray(extractedDatabases) ? extractedDatabases : []);
      setTools(Array.isArray(extractedTools) ? extractedTools : []);
    } catch (err) {
      console.error("❌ [SkillsContent] Erreur lors du chargement des compétences", err);
    } finally {
      setLoading(false);
      console.log("🏁 [SkillsContent] Fin du chargement (loading = false)");
    }
  };

  const filterItems = (items: any[]) => {
    if (!searchTerm) return items;
    return items.filter(item => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filteredFrameworks = filterItems(frameworks);
  const filteredDatabases = filterItems(databases);
  const filteredTools = filterItems(tools);

  const totalCount = filteredFrameworks.length + filteredDatabases.length + filteredTools.length;

  console.log("📊 [SkillsContent] Compteurs actuels ->", {
    totalFrameworks: frameworks.length,
    filteredFrameworks: filteredFrameworks.length,
    totalDatabases: databases.length,
    filteredDatabases: filteredDatabases.length,
    totalTools: tools.length,
    filteredTools: filteredTools.length,
    totalCount,
    loading,
    activeTab
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <SkillsBackground3D />
      
      <div className="container py-5 position-relative" style={{ zIndex: 1, color: '#ffffff' }}>
      
      {/* Header de la section */}
      <div className="text-center mb-5" data-aos="fade-down">
        <span className="badge px-3 py-2 fw-bold text-uppercase mb-3 font-monospace" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', borderRadius: '8px', letterSpacing: '1px', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
          Expertise & Stack Technique
        </span>
        <h1 className="fw-extrabold display-5 text-white mb-3" style={{ letterSpacing: '-0.5px' }}>
          Mes Compétences
        </h1>
        <p className="mx-auto" style={{ maxWidth: '600px', fontSize: '1.05rem', color: '#cbd5e1' }}>
          Découvrez l'ensemble des technologies, frameworks, bases de données et outils que j'utilise pour concevoir des applications web performantes.
        </p>
      </div>

      {/* Barre de recherche et Filtres par onglets */}
      <div className="row justify-content-center mb-5 g-3" data-aos="fade-up" data-aos-delay="100">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="input-group shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
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
          <button 
            onClick={() => setActiveTab('all')} 
            className={`btn fw-bold px-4 py-2 transition-all shadow-sm ${activeTab === 'all' ? 'text-white' : 'text-light'}`}
            style={{ backgroundColor: activeTab === 'all' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            Tout voir
          </button>
          <button 
            onClick={() => setActiveTab('frameworks')} 
            className={`btn fw-bold px-4 py-2 transition-all shadow-sm ${activeTab === 'frameworks' ? 'text-white' : 'text-light'}`}
            style={{ backgroundColor: activeTab === 'frameworks' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            Frameworks
          </button>
          <button 
            onClick={() => setActiveTab('databases')} 
            className={`btn fw-bold px-4 py-2 transition-all shadow-sm ${activeTab === 'databases' ? 'text-white' : 'text-light'}`}
            style={{ backgroundColor: activeTab === 'databases' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            Bases de données
          </button>
          <button 
            onClick={() => setActiveTab('tools')} 
            className={`btn fw-bold px-4 py-2 transition-all shadow-sm ${activeTab === 'tools' ? 'text-white' : 'text-light'}`}
            style={{ backgroundColor: activeTab === 'tools' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            Outils & DevOps
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
          <p className="mt-3 fw-semibold text-white">Chargement de vos compétences...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-5 card border-0 shadow-sm p-5" style={{ borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h4 className="fw-semibold text-white">Aucun résultat trouvé pour votre recherche.</h4>
        </div>
      ) : (
        <div className="row g-4">
          
          {/* SECTION FRAMEWORKS */}
          {(activeTab === 'all' || activeTab === 'frameworks') && filteredFrameworks.length > 0 && (
            <div className="col-12 mb-4" data-aos="fade-up">
              <div className="d-flex align-items-center mb-3">
                <div className="p-2 rounded-3 me-2 shadow-sm" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}>
                  <MdCode size={24} />
                </div>
                <h3 className="fw-bold mb-0 text-white">Frameworks & Langages</h3>
              </div>
              
              <div className="row g-4">
                {filteredFrameworks.map((fw: any, index: number) => {
                  const rawLevel = fw.level ? String(fw.level).replace('%', '').trim() : '0';
                  const percentage = isNaN(Number(rawLevel)) ? 50 : Number(rawLevel);

                  return (
                    <div className="col-12 col-md-6 col-lg-4" key={fw.id || index}>
                      <SkillTiltCard index={index}>
                        <div className="card border-0 shadow-sm p-4 h-100 transition-all hover-shadow" style={{ borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <div className="d-flex align-items-center mb-3">
                            {fw.icon ? (
                              <img 
                                src={`http://127.0.0.1:8000/storage/${fw.icon}`} 
                                alt={fw.name} 
                                style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }} 
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdImage size={24} className="text-light" />
                              </div>
                            )}
                            <div className="ms-3">
                              <h5 className="fw-bold mb-1 text-white">{fw.name}</h5>
                              <span className="badge px-2 py-1 fw-semibold" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', fontSize: '0.75rem', borderRadius: '6px' }}>
                                {fw.type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="font-monospace" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Maîtrise</span>
                              <span className="fw-bold text-white font-monospace" style={{ fontSize: '0.85rem' }}>{percentage}%</span>
                            </div>
                            <div className="progress" style={{ height: '8px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                              <div className="progress-bar" role="progressbar" style={{ width: `${percentage}%`, backgroundColor: '#3b82f6', borderRadius: '6px', transition: 'width 1s ease-in-out' }} />
                            </div>
                          </div>
                        </div>
                      </SkillTiltCard>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION DATABASES */}
          {(activeTab === 'all' || activeTab === 'databases') && filteredDatabases.length > 0 && (
            <div className="col-12 mb-4" data-aos="fade-up">
              <div className="d-flex align-items-center mb-3">
                <div className="p-2 rounded-3 me-2 shadow-sm" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}>
                  <MdStorage size={24} />
                </div>
                <h3 className="fw-bold mb-0 text-white">Bases de Données</h3>
              </div>
              
              <div className="row g-4">
                {filteredDatabases.map((db: any, index: number) => {
                  const rawLevel = db.level ? String(db.level).replace('%', '').trim() : '0';
                  const percentage = isNaN(Number(rawLevel)) ? 50 : Number(rawLevel);

                  return (
                    <div className="col-12 col-md-6 col-lg-4" key={db.id || index}>
                      <SkillTiltCard index={index}>
                        <div className="card border-0 shadow-sm p-4 h-100 transition-all hover-shadow" style={{ borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <div className="d-flex align-items-center mb-3">
                            {db.icon ? (
                              <img 
                                src={`http://127.0.0.1:8000/storage/${db.icon}`} 
                                alt={db.name} 
                                style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }} 
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdImage size={24} className="text-light" />
                              </div>
                            )}
                            <div className="ms-3">
                              <h5 className="fw-bold mb-1 text-white">{db.name}</h5>
                              <span className="badge px-2 py-1 fw-semibold" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', fontSize: '0.75rem', borderRadius: '6px' }}>
                                {db.type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="font-monospace" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Maîtrise</span>
                              <span className="fw-bold text-white font-monospace" style={{ fontSize: '0.85rem' }}>{percentage}%</span>
                            </div>
                            <div className="progress" style={{ height: '8px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                              <div className="progress-bar" role="progressbar" style={{ width: `${percentage}%`, backgroundColor: '#3b82f6', borderRadius: '6px', transition: 'width 1s ease-in-out' }} />
                            </div>
                          </div>
                        </div>
                      </SkillTiltCard>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION TOOLS */}
          {(activeTab === 'all' || activeTab === 'tools') && filteredTools.length > 0 && (
            <div className="col-12 mb-4" data-aos="fade-up">
              <div className="d-flex align-items-center mb-3">
                <div className="p-2 rounded-3 me-2 shadow-sm" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}>
                  <MdBuild size={24} />
                </div>
                <h3 className="fw-bold mb-0 text-white">Outils & DevOps</h3>
              </div>
              
              <div className="row g-4">
                {filteredTools.map((tool: any, index: number) => {
                  const rawLevel = tool.level ? String(tool.level).replace('%', '').trim() : '0';
                  const percentage = isNaN(Number(rawLevel)) ? 50 : Number(rawLevel);

                  return (
                    <div className="col-12 col-md-6 col-lg-4" key={tool.id || index}>
                      <SkillTiltCard index={index}>
                        <div className="card border-0 shadow-sm p-4 h-100 transition-all hover-shadow" style={{ borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <div className="d-flex align-items-center mb-3">
                            {tool.icon ? (
                              <img 
                                src={`http://127.0.0.1:8000/storage/${tool.icon}`} 
                                alt={tool.name} 
                                style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }} 
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdImage size={24} className="text-light" />
                              </div>
                            )}
                            <div className="ms-3">
                              <h5 className="fw-bold mb-1 text-white">{tool.name}</h5>
                              <span className="badge px-2 py-1 fw-semibold" style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', fontSize: '0.75rem', borderRadius: '6px' }}>
                                {tool.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="font-monospace" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Maîtrise</span>
                              <span className="fw-bold text-white font-monospace" style={{ fontSize: '0.85rem' }}>{percentage}%</span>
                            </div>
                            <div className="progress" style={{ height: '8px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                              <div className="progress-bar" role="progressbar" style={{ width: `${percentage}%`, backgroundColor: '#3b82f6', borderRadius: '6px', transition: 'width 1s ease-in-out' }} />
                            </div>
                          </div>
                        </div>
                      </SkillTiltCard>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      </div>
    </div>
  );
}