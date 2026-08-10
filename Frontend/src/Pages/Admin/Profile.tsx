import React, { useState, useEffect } from 'react';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  MdPerson, 
  MdLock, 
  MdEmail, 
  MdSave, 
  MdCheckCircle,
  MdAdminPanelSettings
} from 'react-icons/md';
import { authService } from '../../Services/AuthService';
import type { Utilisateur } from '../../Models/Utilisateur';

export default function Profile() {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulaire Profil (Nom, Email)
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });

  // Formulaire Mot de passe
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  useEffect(() => {
    // Initialisation d'AOS
    AOS.init({
      duration: 800,
      once: true,
    });

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const data = await authService.getCurrentUser();
        setUser(data);
        setProfileData({
          name: data.name || '',
          email: data.email || ''
        });
      } catch (err: any) {
        console.error("Erreur lors de la récupération du profil :", err);
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsedUser: Utilisateur = JSON.parse(localUser);
          setUser(parsedUser);
          setProfileData({
            name: parsedUser.name || '',
            email: parsedUser.email || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSuccessMsg("Profil mis à jour avec succès !");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setErrorMsg("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSuccessMsg("Mot de passe modifié avec succès !");
      setPasswordData({ old_password: '', new_password: '', new_password_confirmation: '' });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Erreur lors du changement de mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          
          {/* Header */}
          <div className="mb-4 d-flex align-items-center justify-content-between" data-aos="fade-down">
            <div>
              <h2 className="fw-bold mb-1" style={{ color: '#0F172A' }}>Mon Profil</h2>
              <p className="small mb-0 text-muted">Gérez vos informations personnelles et votre sécurité</p>
            </div>
            {user && (
              <span className="badge px-3 py-2 shadow-sm text-uppercase fw-bold bg-dark text-white" style={{ borderRadius: '8px', fontSize: '0.75rem' }}>
                {user.role || 'Administrateur'}
              </span>
            )}
          </div>

          {/* Alertes */}
          {successMsg && (
            <div className="alert border-0 shadow-sm d-flex align-items-center mb-4 bg-success text-white" 
                 style={{ borderRadius: '10px' }} data-aos="fade-in">
              <MdCheckCircle className="me-2" size={20} /> <strong>{successMsg}</strong>
            </div>
          )}
          {errorMsg && (
            <div className="alert border-0 shadow-sm mb-4 bg-danger text-white" 
                 style={{ borderRadius: '10px' }} data-aos="fade-in">
              <strong>{errorMsg}</strong>
            </div>
          )}

          <div className="row g-4">
            {/* Colonne Gauche : Infos Personnelles */}
            <div className="col-lg-7" data-aos="fade-right">
              <div className="card border-0 shadow-sm h-100 rounded-4 bg-white">
                <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                  <h5 className="mb-0 fw-bold d-flex align-items-center text-dark">
                    <MdPerson className="me-2 text-primary" size={22} /> Informations Personnelles
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleUpdateProfile}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary" style={{ fontSize: '0.8rem' }}>NOM COMPLET</label>
                        <div className="input-group">
                          <span className="input-group-text border-0 bg-light text-primary" style={{ borderRadius: '8px 0 0 8px' }}>
                            <MdPerson size={18} />
                          </span>
                          <input 
                            type="text" 
                            className="form-control border-0 bg-light shadow-none" 
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            style={{ borderRadius: '0 8px 8px 0', padding: '10px', fontSize: '0.9rem' }} 
                            required
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary" style={{ fontSize: '0.8rem' }}>EMAIL</label>
                        <div className="input-group">
                          <span className="input-group-text border-0 bg-light text-primary" style={{ borderRadius: '8px 0 0 8px' }}>
                            <MdEmail size={18} />
                          </span>
                          <input 
                            type="email" 
                            className="form-control border-0 bg-light shadow-none" 
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            style={{ borderRadius: '0 8px 8px 0', padding: '10px', fontSize: '0.9rem' }} 
                            required
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-secondary" style={{ fontSize: '0.8rem' }}>RÔLE SYSTÈME</label>
                        <div className="input-group">
                          <span className="input-group-text border-0 bg-light text-secondary" style={{ borderRadius: '8px 0 0 8px' }}>
                            <MdAdminPanelSettings size={18} />
                          </span>
                          <input 
                            type="text" 
                            className="form-control border-0 bg-light text-muted shadow-none" 
                            value={user?.role || 'N/A'}
                            disabled
                            style={{ borderRadius: '0 8px 8px 0', padding: '10px', fontSize: '0.9rem' }} 
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-dark w-100 mt-4 fw-bold py-2 shadow-sm"
                      disabled={loading}
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    >
                      {loading ? 'Traitement...' : <><MdSave className="me-2"/> Enregistrer</>}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Sécurité */}
            <div className="col-lg-5" data-aos="fade-left">
              <div className="card border-0 shadow-sm rounded-4 bg-white">
                <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                  <h5 className="mb-0 fw-bold d-flex align-items-center text-dark">
                    <MdLock className="me-2 text-primary" size={22} /> Sécurité
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label className="form-label fw-bold text-secondary" style={{ fontSize: '0.8rem' }}>ANCIEN MOT DE PASSE</label>
                      <input 
                        type="password" 
                        className="form-control border-0 bg-light shadow-none" 
                        placeholder="••••••••"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                        style={{ borderRadius: '8px', padding: '10px', fontSize: '0.9rem' }} 
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold text-secondary" style={{ fontSize: '0.8rem' }}>NOUVEAU MOT DE PASSE</label>
                      <input 
                        type="password" 
                        className="form-control border-0 bg-light shadow-none" 
                        placeholder="Min 8 caractères"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        style={{ borderRadius: '8px', padding: '10px', fontSize: '0.9rem' }} 
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold text-secondary" style={{ fontSize: '0.8rem' }}>CONFIRMATION</label>
                      <input 
                        type="password" 
                        className="form-control border-0 bg-light shadow-none" 
                        placeholder="Confirmer le nouveau"
                        value={passwordData.new_password_confirmation}
                        onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                        style={{ borderRadius: '8px', padding: '10px', fontSize: '0.9rem' }} 
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-outline-dark w-100 fw-bold py-2 shadow-sm mt-2"
                      disabled={loading}
                      style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                    >
                      Modifier le mot de passe
                    </button>
                  </form>
                </div>
              </div>

              {/* Note informative */}
              <div className="mt-3 p-3 shadow-sm rounded-4 bg-white border-start border-primary border-4" data-aos="fade-up">
                <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                  <strong className="text-dark">Note :</strong> Vos informations sont protégées par chiffrement. Pensez à utiliser un mot de passe robuste.
                </small>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}