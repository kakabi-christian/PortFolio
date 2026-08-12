// src/components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  MdLogout,
  MdAccountCircle,
  MdMenu,
  MdDashboard,
  MdBarChart,
  MdStorage,
  MdLayers,
  MdBuild,
  MdFolder,
  MdContacts
} from "react-icons/md";
import { authService } from "../../Services/AuthService";
import { ContactService } from "../../Services/ContactService";

/* ============================================================
   THEME — mêmes couleurs que Home / Skills / Contact / Login
   ============================================================ */
const ACCENT = '#38bdf8';
const DANGER = '#ef4444';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await ContactService.getUnreadCount();
      const count = typeof data === 'number' ? data : (data.count || data.unread_count || 0);
      setUnreadCount(count);
    } catch (error) {
      console.error("Erreur lors de la récupération des messages non lus", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Écouteur pour forcer la mise à jour instantanée si un message est lu
    const handleContactUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener('contactRead', handleContactUpdate);
    window.addEventListener('focus', handleContactUpdate); // Actualise aussi si l'onglet redevient actif

    const interval = setInterval(fetchUnreadCount, 30000); // Réduit à 30s si besoin

    return () => {
      clearInterval(interval);
      window.removeEventListener('contactRead', handleContactUpdate);
      window.removeEventListener('focus', handleContactUpdate);
    };
  }, [location.pathname]);

  const confirmLogout = async () => {
    try {
      await authService.logout();
      setShowLogoutModal(false);
      navigate("/login"); 
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setShowLogoutModal(false);
      navigate("/login");
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "nav-link active text-slate-900 fw-bold shadow-sm"
      : "nav-link text-white fw-bold opacity-75 hover-opacity-100";

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    backgroundColor: isActive ? ACCENT : 'transparent',
    color: isActive ? '#0f172a' : '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCollapsed ? 'center' : 'space-between',
    padding: isCollapsed ? '10px 0' : '10px 15px',
    position: 'relative' as const,
  });

  return (
    <>
      <style>{`
        .sidebar-container.collapsed .nav-item .nav-link::after {
          content: attr(data-label);
          position: absolute;
          left: 100%;
          margin-left: 15px;
          padding: 5px 10px;
          background: ${ACCENT};
          color: #0f172a;
          font-weight: 600;
          border-radius: 5px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: 0.2s ease;
          z-index: 2000;
          font-size: 0.8rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .sidebar-container.collapsed .nav-item .nav-link:hover::after {
          opacity: 1;
          visibility: visible;
        }
      `}</style>

      <div
        className={`d-flex flex-column flex-shrink-0 p-3 shadow sidebar-container ${isCollapsed ? "collapsed" : ""}`}
        style={{ 
          width: isCollapsed ? "80px" : "280px", 
          minHeight: "100vh", 
          backgroundColor: "#020617", 
          color: "#ffffff",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          transition: "all 0.3s ease",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1000
        }}
      >
        <div className={`d-flex align-items-center mb-4 mt-2 ${isCollapsed ? 'justify-content-center' : 'justify-content-between'}`}>
          {!isCollapsed && (
            <div className="d-flex align-items-center text-decoration-none">
              <MdDashboard style={{ color: ACCENT }} className="me-2" size={32} />
              <div className="d-flex flex-column">
                <span className="fs-4 fw-bold text-white" style={{ lineHeight: '1.2' }}>Admin</span>
              </div>
            </div>
          )}
          <button 
            className="btn text-white p-0 border-0" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ fontSize: '28px' }}
          >
            <MdMenu style={{ color: ACCENT }} />
          </button>
        </div>

        <hr style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", height: '1px', border: 'none' }} />

        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <NavLink to="/admin/stats" className={navLinkClasses} style={navLinkStyle} data-label="Tableau de Bord">
              <div className="d-flex align-items-center">
                <MdDashboard className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Tableau de Bord</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/stats-graphe" className={navLinkClasses} style={navLinkStyle} data-label="Analyses Graphiques">
              <div className="d-flex align-items-center">
                <MdBarChart className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Analyses Graphiques</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/databases" className={navLinkClasses} style={navLinkStyle} data-label="Bases de données">
              <div className="d-flex align-items-center">
                <MdStorage className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Bases de données</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/frameworks" className={navLinkClasses} style={navLinkStyle} data-label="Frameworks">
              <div className="d-flex align-items-center">
                <MdLayers className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Frameworks</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/tools" className={navLinkClasses} style={navLinkStyle} data-label="Outils">
              <div className="d-flex align-items-center">
                <MdBuild className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Outils</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/projects" className={navLinkClasses} style={navLinkStyle} data-label="Projets">
              <div className="d-flex align-items-center">
                <MdFolder className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Projets</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/contacts" className={navLinkClasses} style={navLinkStyle} data-label={`Contacts ${unreadCount > 0 ? `(${unreadCount})` : ''}`}>
              <div className="d-flex align-items-center">
                <MdContacts className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Contacts</span>}
              </div>
              {unreadCount > 0 && (
                <span 
                  className="badge rounded-pill" 
                  style={{ 
                    backgroundColor: DANGER, 
                    color: '#fff', 
                    fontSize: '0.75rem',
                    padding: isCollapsed ? '2px 5px' : '0.35em 0.65em',
                    position: isCollapsed ? 'absolute' : 'static',
                    top: isCollapsed ? '5px' : 'auto',
                    right: isCollapsed ? '5px' : 'auto'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/profile" className={navLinkClasses} style={navLinkStyle} data-label="Mon Profil">
              <div className="d-flex align-items-center">
                <MdAccountCircle className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Mon Profil</span>}
              </div>
            </NavLink>
          </li>
        </ul>

        <hr style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", height: '1px', border: 'none' }} />

        <div className="mt-auto">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`btn w-100 d-flex align-items-center gap-2 p-3 text-danger border-0 ${isCollapsed ? 'justify-content-center' : 'justify-content-start'}`}
            style={{ 
              borderRadius: '12px', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              transition: 'all 0.2s'
            }}
          >
            <MdLogout size={22} style={{ color: DANGER }} />
            {!isCollapsed && <span className="fw-bold">Déconnexion</span>}
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', backgroundColor: '#020617', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="modal-body p-4 text-center">
                <div className="mb-3">
                    <MdLogout size={50} style={{ color: DANGER }} />
                </div>
                <h5 className="fw-bold mb-3 text-white">Déconnexion</h5>
                <p style={{ color: '#94a3b8' }}>Êtes-vous sûr de vouloir quitter votre session ?</p>
                <div className="d-flex gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn fw-bold w-50 py-2" 
                    style={{ color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px' }} 
                    onClick={() => setShowLogoutModal(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    type="button" 
                    className="btn fw-bold w-50 py-2 shadow-sm text-white" 
                    style={{ backgroundColor: DANGER, borderRadius: '10px' }} 
                    onClick={confirmLogout}
                  >
                    Oui, quitter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;