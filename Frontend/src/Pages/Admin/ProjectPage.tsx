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
  MdFilterList,
  MdCode,
  MdLaunch
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ProjectService } from '../../Services/ProjectService';
import type { Project } from '../../Models/Project';

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recherche et Filtrage
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterFeatured, setFilterFeatured] = useState<string>('');

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
    title: string;
    description: string;
    image_url: File | string | null;
    github_url: string;
    demo_url: string;
    featured: boolean;
  }>({
    title: '',
    description: '',
    image_url: null,
    github_url: '',
    demo_url: '',
    featured: false
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const fetchProjects = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await ProjectService.getAll(page);

      // Réponse Laravel typique : { status, data: { current_page, data: [...], last_page, ... } }
      // Mais on reste défensif au cas où le backend renvoie directement un tableau,
      // ou directement le paginator sans le wrapper { status, data }.
      let list: Project[] = [];
      let paginationSource: any = null;

      if (Array.isArray(data)) {
        // Cas: réponse = tableau brut de projets
        list = data;
      } else if (Array.isArray(data?.data)) {
        // Cas: réponse = { data: [...] } (déjà le tableau, pas de wrapper paginator)
        list = data.data;
        paginationSource = data;
      } else if (Array.isArray(data?.data?.data)) {
        // Cas standard Laravel: { status, data: { current_page, data: [...], last_page, ... } }
        list = data.data.data;
        paginationSource = data.data;
      }

      setProjects(list);

      if (paginationSource && typeof paginationSource.last_page === 'number') {
        setLastPage(paginationSource.last_page);
        setCurrentPage(paginationSource.current_page || page);
      } else {
        setLastPage(1);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des projets", err);
      setErrorMsg("Impossible de charger les projets.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage);
  }, [currentPage]);

  // Filtrage sécurisé (on s'assure que projects est un tableau)
  const projectsList = Array.isArray(projects) ? projects : [];
  const filteredProjects = projectsList.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFeatured = filterFeatured === '' ? true : 
                            filterFeatured === 'true' ? project.featured : !project.featured;
    return matchesSearch && matchesFeatured;
  });

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      title: '',
      description: '',
      image_url: null,
      github_url: '',
      demo_url: '',
      featured: false
    });
    setPreviewImage(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (project: Project) => {
    setIsEditing(true);
    setCurrentId(project.id || null);
    setFormData({
      title: project.title,
      description: project.description,
      image_url: project.image_url || null,
      github_url: project.github_url || '',
      demo_url: project.demo_url || '',
      featured: project.featured
    });
    setPreviewImage(typeof project.image_url === 'string' ? `http://127.0.0.1:8000/storage/${project.image_url}` : null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image_url: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const dataToSend = new FormData();
      dataToSend.append('title', formData.title);
      dataToSend.append('description', formData.description);
      dataToSend.append('featured', formData.featured ? '1' : '0');
      dataToSend.append('github_url', formData.github_url || '');
      dataToSend.append('demo_url', formData.demo_url || '');
      
      if (formData.image_url instanceof File) {
        dataToSend.append('image_url', formData.image_url);
      }

      if (isEditing && currentId) {
        dataToSend.append('_method', 'PUT');
        await ProjectService.update(currentId, dataToSend as any);
        setSuccessMsg("Projet mis à jour avec succès !");
      } else {
        await ProjectService.create(dataToSend as any);
        setSuccessMsg("Projet créé avec succès !");
      }

      setShowModal(false);
      fetchProjects(currentPage);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentId) return;
    try {
      await ProjectService.delete(currentId);
      setSuccessMsg("Projet supprimé avec succès !");
      setShowDeleteModal(false);
      fetchProjects(currentPage);
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
                Gestion des Projets
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Organisez et pilotez l'ensemble de vos réalisations et projets web/mobile.
              </p>
            </div>
            <button 
              className="btn fw-bold d-flex align-items-center justify-content-center shadow-lg px-4 py-2 text-white transition-all"
              onClick={handleOpenAddModal}
              style={{ backgroundColor: '#2563eb', borderRadius: '12px', border: 'none', transition: 'transform 0.2s' }}
            >
              <MdAdd size={22} className="me-2" /> Nouveau Projet
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
                  placeholder="Rechercher par titre ou description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '0 12px 12px 0', fontSize: '0.95rem' }}
                />
              </div>
              
              <div className="input-group" style={{ width: 'auto', minWidth: '250px' }}>
                <span className="input-group-text border-0" style={{ backgroundColor: '#f8fafc', color: '#64748b', borderRadius: '12px 0 0 12px' }}>
                  <MdFilterList size={22} />
                </span>
                <select 
                  className="form-select shadow-none border-0 py-2" 
                  value={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.value)}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '0 12px 12px 0', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  <option value="">Tous les projets</option>
                  <option value="true">Mis en avant (Featured)</option>
                  <option value="false">Standards</option>
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

          {/* Tableau des Projets */}
          <div className="card border-0 shadow-sm overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9' }} data-aos="fade-up" data-aos-delay="200">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ color: '#1e293b' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                    <tr>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Image</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Titre</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Description</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Liens</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Statut</th>
                      <th className="py-3 px-4 text-end text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          <div className="spinner-border text-primary me-2" role="status" style={{ width: '1.5rem', height: '1.5rem' }}></div>
                          Chargement en cours...
                        </td>
                      </tr>
                    ) : filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">Aucun projet trouvé.</td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr key={project.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                          <td className="py-3 px-4">
                            {project.image_url ? (
                              <img 
                                src={`http://127.0.0.1:8000/storage/${project.image_url}`} 
                                alt={project.title} 
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdImage size={20} className="text-muted" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 fw-bold text-dark">{project.title}</td>
                          <td className="py-3 px-4 text-muted" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {project.description}
                          </td>
                          <td className="py-3 px-4">
                            <div className="d-flex gap-2">
                              {project.github_url && (
                                <a 
                                  href={project.github_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-sm shadow-sm"
                                  style={{ backgroundColor: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '6px 8px' }}
                                  title="Voir le code GitHub"
                                >
                                  <MdCode size={16} />
                                </a>
                              )}
                              {project.demo_url && (
                                <a 
                                  href={project.demo_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-sm shadow-sm"
                                  style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '6px 8px' }}
                                  title="Voir la démo en direct"
                                >
                                  <MdLaunch size={16} />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {project.featured ? (
                              <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px' }}>
                                Mis en avant
                              </span>
                            ) : (
                              <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                Standard
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button 
                              className="btn btn-sm me-2 shadow-sm" 
                              onClick={() => handleOpenEditModal(project)}
                              style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 10px' }}
                              title="Modifier"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button 
                              className="btn btn-sm shadow-sm" 
                              onClick={() => { setCurrentId(project.id || null); setShowDeleteModal(true); }}
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

            {/* Pagination si applicable */}
            {lastPage > 1 && (
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
            )}
          </div>

        </div>
      </div>

      {/* MODAL AJOUT / MODIFICATION */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', backgroundColor: '#ffffff', color: '#1e293b' }} data-aos="zoom-in">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-extrabold text-dark">{isEditing ? "Modifier le Projet" : "Ajouter un Projet"}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Titre du Projet</label>
                    <input 
                      type="text" 
                      className="form-control shadow-none" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                      required 
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Description</label>
                    <textarea 
                      className="form-control shadow-none" 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Lien GitHub</label>
                      <input 
                        type="url" 
                        className="form-control shadow-none" 
                        placeholder="https://github.com/..."
                        value={formData.github_url}
                        onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                        style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Lien Démo / Live</label>
                      <input 
                        type="url" 
                        className="form-control shadow-none" 
                        placeholder="https://..."
                        value={formData.demo_url}
                        onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                        style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                      />
                    </div>
                  </div>

                  <div className="mb-3 form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input shadow-none" 
                      id="featuredCheck"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      style={{ cursor: 'pointer', width: '20px', height: '20px', borderRadius: '6px' }}
                    />
                    <label className="form-check-label fw-semibold ms-2 text-dark" htmlFor="featuredCheck" style={{ cursor: 'pointer' }}>
                      Mettre ce projet en avant (Featured)
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Image de couverture</label>
                    <input 
                      type="file" 
                      className="form-control shadow-none" 
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                    />
                    {previewImage && (
                      <div className="mt-3 text-center">
                        <img src={previewImage} alt="Aperçu" style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '10px', backgroundColor: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0' }} />
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
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Voulez-vous vraiment supprimer ce projet ? Cette action est irréversible.</p>
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