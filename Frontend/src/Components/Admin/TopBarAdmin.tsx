import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdNotificationsNone, 
    MdLogout, 
    MdPerson, 
    MdLightMode, 
    MdDarkMode,
    MdKeyboardArrowDown,
    MdMenu
} from 'react-icons/md';
import { authService } from '../../Services/AuthService';
import type { Utilisateur } from '../../Models/Utilisateur';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TopBarAdminProps {
    onMenuClick?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TopBarAdmin: React.FC<TopBarAdminProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [user, setUser] = useState<Utilisateur | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // 👤 Récupération dynamique de l'utilisateur
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Erreur de lecture de user", e);
            }
        }
    }, []);

    // 🖱️ Fermer le menu si clic extérieur
    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', closeMenu);
        return () => document.removeEventListener('mousedown', closeMenu);
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate("/login");
        } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            navigate("/login");
        }
    };

    const userInitial = user?.name
        ? user.name.charAt(0).toUpperCase()
        : user?.email
            ? user.email.charAt(0).toUpperCase()
            : 'A';

    return (
        <header
            className="topbar-admin"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderBottom: `1px solid var(--color-border)`,
            }}
        >
            {/* ── GAUCHE : Hamburger (mobile) ── */}
            <div className="topbar-left">
                {onMenuClick && (
                    <button
                        className="hamburger-btn"
                        onClick={onMenuClick}
                        aria-label="Ouvrir le menu"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <MdMenu size={26} />
                    </button>
                )}
            </div>

            {/* ── DROITE : Actions ── */}
            <div className="topbar-actions">

                {/* Theme Switcher */}
                <button
                    className="icon-btn"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    style={{ color: 'var(--color-text-muted)' }}
                    aria-label="Changer le thème"
                >
                    {isDarkMode
                        ? <MdLightMode size={22} className="text-warning" />
                        : <MdDarkMode size={22} />
                    }
                </button>

          

                {/* Profil Dropdown */}
                <div className="position-relative" ref={profileRef}>
                    <div
                        className="profile-trigger"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="avatar">
                            {userInitial}
                        </div>
                        <MdKeyboardArrowDown
                            className={`arrow-icon ${showProfileMenu ? 'rotated' : ''}`}
                            style={{ color: 'var(--color-text-muted)' }}
                        />
                    </div>

                    {showProfileMenu && (
                        <div
                            className="profile-dropdown"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-main)',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <div className="profile-info" style={{ borderColor: 'var(--color-border)' }}>
                                <small style={{ color: 'var(--color-text-muted)' }}>Connecté en tant que</small>
                                <span className="profile-name" style={{ color: 'var(--color-primary)' }}>
                                    {user?.name || 'Admin'}
                                </span>
                                <small style={{ color: 'var(--color-text-muted)' }} className="text-truncate">{user?.email}</small>
                            </div>

                            <button
                                className="drop-item"
                                style={{ color: 'var(--color-text-main)' }}
                                onClick={() => navigate('/admin/profile')}
                            >
                                <MdPerson size={18} /> Mon Profil
                            </button>

                            <hr className="drop-divider" style={{ borderColor: 'var(--color-border)' }} />

                            <button className="drop-item danger" onClick={handleLogout}>
                                <MdLogout size={18} /> Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                /* Header */
                .topbar-admin {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    height: 70px;
                    padding: 0 1.25rem;
                    position: sticky;
                    top: 0;
                    z-index: 999;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: background-color 0.3s ease, border-color 0.3s ease;
                }

                @media (min-width: 768px) {
                    .topbar-admin { padding: 0 2rem; }
                }

                /* Left */
                .topbar-left {
                    display: flex;
                    align-items: center;
                }

                /* Hamburger — visible mobile seulement */
                .hamburger-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    padding: 0.4rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .hamburger-btn:hover { background: var(--color-border); }

                @media (min-width: 769px) {
                    .hamburger-btn { display: none; }
                }

                /* Actions */
                .topbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                @media (min-width: 768px) {
                    .topbar-actions { gap: 1rem; }
                }

                /* Icon buttons */
                .icon-btn {
                    background: none;
                    border: none;
                    padding: 0.4rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: background 0.2s;
                }
                .icon-btn:hover { background: var(--color-border); }

                /* Notification badge */
                .notif-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: var(--color-primary);
                    color: var(--color-bg);
                    font-size: 0.6rem;
                    font-weight: 700;
                    padding: 1px 4px;
                    border-radius: 999px;
                    line-height: 1.4;
                }

                /* Profile trigger */
                .profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.3rem 0.5rem;
                    border-radius: 999px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .profile-trigger:hover { background: var(--color-border); }

                /* Avatar */
                .avatar {
                    width: 38px;
                    height: 38px;
                    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
                    color: var(--color-bg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-weight: 700;
                    font-size: 0.95rem;
                    border: 2px solid var(--color-border);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                    flex-shrink: 0;
                }

                /* Arrow */
                .arrow-icon { transition: transform 0.3s ease; }
                .arrow-icon.rotated { transform: rotate(180deg); }

                /* Dropdown */
                .profile-dropdown {
                    position: absolute;
                    right: 0;
                    top: calc(100% + 8px);
                    min-width: 220px;
                    border-radius: 16px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    padding: 0.5rem;
                    z-index: 1000;
                    animation: fadeInDown 0.2s ease;
                }

                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Profile info */
                .profile-info {
                    display: flex;
                    flex-direction: column;
                    padding: 0.75rem 0.85rem;
                    border-bottom: 1px solid;
                    margin-bottom: 0.4rem;
                }
                .profile-info small { font-size: 0.7rem; }
                .profile-name {
                    font-weight: 700;
                    font-size: 0.92rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* Dropdown items */
                .drop-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    width: 100%;
                    background: none;
                    border: none;
                    padding: 0.5rem 0.85rem;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                    text-align: left;
                }
                .drop-item:hover { background: var(--color-primary-hover); color: var(--color-bg) !important; }
                .drop-item.danger { color: var(--color-danger); font-weight: 600; }
                .drop-item.danger:hover { background: var(--color-danger); color: white !important; }

                /* Divider */
                .drop-divider {
                    margin: 0.4rem 0;
                    border-width: 1px;
                    border-style: solid;
                }
            `}</style>
        </header>
    );
};

export default TopBarAdmin;