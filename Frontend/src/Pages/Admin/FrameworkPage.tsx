import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdLayers, 
  MdCheckCircle, 
  MdSave,
  MdImage,
  MdSearch,
  MdFilterList
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { frameworkService } from '../../Services/FrameworkService';
import type { Framework } from '../../Models/Framework';

export default function FrameworkPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recherche et Filtrage
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

  // Modales
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Formulaire
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    proficiency: number;
    icon: File | string | null;
  }>({
    name: '',
    category: 'Frontend', // Valeur par défaut correspondant à l'Enum
    proficiency: 50,
    icon: null
  });

  const [previewIcon, setPreviewIcon] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const fetchFrameworks = async (page = 1) => {
    try {
      setLoading(true);
      const data = await frameworkService.getAll(page, searchTerm, filterCategory);
      setFrameworks(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
    } catch (err) {
      console.error("Erreur lors de la récupération des frameworks", err);
      setErrorMsg("Impossible de charger les frameworks.");
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour la recherche
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFrameworks(currentPage);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm, filterCategory]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ name: '', category: 'Frontend', proficiency: 50, icon: null });
    setPreviewIcon(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (framework: Framework) => {
    setIsEditing(true);
    setCurrentId(framework.id || null);
    setFormData({
      name: framework.name,
      category: framework.category,
      proficiency: framework.proficiency,
      icon: framework.icon || null
    });
    setPreviewIcon(typeof framework.icon === 'string' ? `http://127.0.0.1:8000/storage/${framework.icon}` : null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, icon: file });
      setPreviewIcon(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: Framework = {
        name: formData.name,
        category: formData.category,
        proficiency: Number(formData.proficiency),
        icon: formData.icon instanceof File ? formData.icon : undefined
      };

      if (isEditing && currentId) {
        await frameworkService.update(currentId, payload);
        setSuccessMsg("Framework mis à jour avec succès !");
      } else {
        await frameworkService.create(payload);
        setSuccessMsg("Framework créé avec succès !");
      }

      setShowModal(false);
      fetchFrameworks(currentPage);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentId) return;
    try {
      await frameworkService.delete(currentId);
      setSuccessMsg("Framework supprimé avec succès !");
      setShowDeleteModal(false);
      fetchFrameworks(currentPage);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="container-fluid py-5" style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#1e293b' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          
          {/* Header de la page */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3" data-aos="fade-down">
            <div>
              <h2 className="fw-extrabold mb-1 d-flex align-items-center text-dark" style={{ letterSpacing: '-0.5px' }}>
                <div className="p-2 rounded-3 me-3 shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <MdLayers size={28} />
                </div>
                Gestion des Frameworks
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Organisez et pilotez l'ensemble de vos technologies et compétences techniques avec élégance.
              </p>
            </div>
            <button 
              className="btn fw-bold d-flex align-items-center justify-content-center shadow-lg px-4 py-2 text-white transition-all"
              onClick={handleOpenAddModal}
              style={{ backgroundColor: '#2563eb', borderRadius: '12px', border: 'none', transition: 'transform 0.2s' }}
            >
              <MdAdd size={22} className="me-2" /> Nouveau Framework
            </button>
          </div>

          {/* Barre de Recherche et Filtres */}
          <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9' }} data-aos="fade-up" data-aos-delay="100">
            <div className="card-body p-3 d-flex flex-column flex-md-row gap-3">
              <div className="input-group" style={{ flex: '1' }}>
                <span className="input-group-text border-0" style={{ backgroundColor: '#f8fafc', color: '#64748b', borderRadius: '12px 0 0 12px' }}>
                  <MdSearch size={22} />
                </span>
                <input 
                  type="text" 
                  className="form-control shadow-none border-0 py-2" 
                  placeholder="Rechercher par nom..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '0 12px 12px 0', fontSize: '0.95rem' }}
                />
              </div>
              
              <div className="input-group" style={{ width: 'auto', minWidth: '250px' }}>
                <span className="input-group-text border-0" style={{ backgroundColor: '#f8fafc', color: '#64748b', borderRadius: '12px 0 0 12px' }}>
                  <MdFilterList size={22} />
                </span>
                <select 
                  className="form-select shadow-none border-0 py-2" 
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '0 12px 12px 0', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  <option value="">Toutes les catégories</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages d'alerte */}
          {successMsg && (
            <div className="alert border-0 shadow-sm d-flex align-items-center mb-4 text-white" 
                 style={{ backgroundColor: '#10b981', borderRadius: '12px' }} data-aos="fade-in">
              <MdCheckCircle className="me-2" size={20} /> <strong>{successMsg}</strong>
            </div>
          )}
          {errorMsg && (
            <div className="alert border-0 shadow-sm mb-4 text-white" 
                 style={{ backgroundColor: '#ef4444', borderRadius: '12px' }} data-aos="fade-in">
              <strong>{errorMsg}</strong>
            </div>
          )}

          {/* Tableau des Frameworks */}
          <div className="card border-0 shadow-sm overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9' }} data-aos="fade-up" data-aos-delay="200">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ color: '#1e293b' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                    <tr>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Icône</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Nom</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Catégorie</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Maîtrise (%)</th>
                      <th className="py-3 px-4 text-end text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted">
                          <div className="spinner-border text-primary me-2" role="status" style={{ width: '1.5rem', height: '1.5rem' }}></div>
                          Chargement en cours...
                        </td>
                      </tr>
                    ) : frameworks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted">Aucun framework trouvé.</td>
                      </tr>
                    ) : (
                      frameworks.map((fw) => (
                        <tr key={fw.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                          <td className="py-3 px-4">
                            {fw.icon ? (
                              <img 
                                src={`http://127.0.0.1:8000/storage/${fw.icon}`} 
                                alt={fw.name} 
                                style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '10px', backgroundColor: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0' }} 
                              />
                            ) : (
                              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdImage size={20} className="text-muted" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 fw-bold text-dark">{fw.name}</td>
                          <td className="py-3 px-4">
                            <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px' }}>
                              {fw.category}
                            </span>
                          </td>
                          <td className="py-3 px-4" style={{ width: '220px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '0.85rem' }}>
                              <span className="fw-bold text-secondary">{fw.proficiency}%</span>
                            </div>
                            <div className="progress shadow-none" style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${fw.proficiency}%`, backgroundColor: '#2563eb', borderRadius: '4px' }} 
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button 
                              className="btn btn-sm me-2 shadow-sm" 
                              onClick={() => handleOpenEditModal(fw)}
                              style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 10px' }}
                              title="Modifier"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button 
                              className="btn btn-sm shadow-sm" 
                              onClick={() => { setCurrentId(fw.id || null); setShowDeleteModal(true); }}
                              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '8px 10px' }}
                              title="Supprimer"
                            >
                              <MdDelete size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center py-3 px-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page <strong>{currentPage}</strong> sur <strong>{lastPage}</strong></span>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm px-3 fw-bold shadow-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                >
                  Précédent
                </button>
                <button 
                  className="btn btn-sm px-3 fw-bold shadow-sm"
                  disabled={currentPage >= lastPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL AJOUT / MODIFICATION */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', backgroundColor: '#ffffff', color: '#1e293b' }} data-aos="zoom-in">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-extrabold text-dark">{isEditing ? "Modifier le Framework" : "Ajouter un Framework"}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Nom du Framework</label>
                    <input 
                      type="text" 
                      className="form-control shadow-none" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                      required 
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Catégorie</label>
                    <select 
                      className="form-select shadow-none" 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                      required
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Mobile">Mobile</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Maîtrise ({formData.proficiency}%)</label>
                    <input 
                      type="range" 
                      className="form-range custom-range" 
                      min="0" 
                      max="100" 
                      value={formData.proficiency}
                      onChange={(e) => setFormData({ ...formData, proficiency: Number(e.target.value) })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Icône (Image)</label>
                    <input 
                      type="file" 
                      className="form-control shadow-none" 
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                    />
                    {previewIcon && (
                      <div className="mt-3 text-center">
                        <img src={previewIcon} alt="Aperçu" style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '10px', backgroundColor: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0' }} />
                      </div>
                    )}
                  </div>

                </div>
                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button 
                    type="button" 
                    className="btn fw-bold px-4 py-2" 
                    onClick={() => setShowModal(false)}
                    style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '12px', border: 'none' }}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn fw-bold px-4 py-2 shadow-sm text-white"
                    style={{ backgroundColor: '#2563eb', borderRadius: '12px', border: 'none' }}
                  >
                    <MdSave className="me-1" size={18} /> Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg text-center" style={{ borderRadius: '24px', backgroundColor: '#ffffff', color: '#1e293b' }} data-aos="zoom-in">
              <div className="modal-body p-4">
                <div className="mb-3 text-danger d-inline-flex p-3 rounded-circle" style={{ backgroundColor: '#fef2f2' }}>
                  <MdDelete size={36} />
                </div>
                <h5 className="fw-bold mb-2 text-dark">Confirmer la suppression</h5>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Voulez-vous vraiment supprimer ce framework ? Cette action est irréversible.</p>
                <div className="d-flex gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn fw-bold w-50 py-2" 
                    style={{ color: '#64748b', backgroundColor: '#f1f5f9', borderRadius: '12px', border: 'none' }} 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    type="button" 
                    className="btn fw-bold w-50 py-2 shadow-sm text-white" 
                    style={{ backgroundColor: '#dc2626', borderRadius: '12px', border: 'none' }} 
                    onClick={handleDeleteConfirm}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}