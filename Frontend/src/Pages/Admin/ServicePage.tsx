import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdMiscellaneousServices,
  MdCheckCircle,
  MdSave,
  MdImage,
  MdSearch,
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { serviceApi } from '../../Services/Service';
import type { Service } from '../../Models/Service';
import { getStorageUrl } from '../../Services/api';

export default function ServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recherche
  const [searchTerm, setSearchTerm] = useState<string>('');

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
    image: File | string | null;
    min_price: string;
    min_duration: string;
  }>({
    title: '',
    description: '',
    image: null,
    min_price: '',
    min_duration: ''
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const fetchServices = async (page: number = 1) => {
    try {
      setLoading(true);
      // Route admin protégée (token Sanctum + rôle admin)
      const response = await serviceApi.getAllAdmin(page, 10);

      setServices(response.data);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (err) {
      console.error("Erreur lors de la récupération des services", err);
      setErrorMsg("Impossible de charger les services.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(currentPage);
  }, [currentPage]);

  // Filtrage sécurisé (on s'assure que services est un tableau)
  const servicesList = Array.isArray(services) ? services : [];
  const filteredServices = servicesList.filter(service =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      title: '',
      description: '',
      image: null,
      min_price: '',
      min_duration: ''
    });
    setPreviewImage(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setIsEditing(true);
    setCurrentId(service.id || null);
    setFormData({
      title: service.title,
      description: service.description,
      image: service.image || null,
      min_price: service.min_price,
      min_duration: service.min_duration
    });
    setPreviewImage(typeof service.image === 'string' ? getStorageUrl(service.image) || null : null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
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
      dataToSend.append('min_price', formData.min_price);
      dataToSend.append('min_duration', formData.min_duration);

      if (formData.image instanceof File) {
        dataToSend.append('image', formData.image);
      }

      if (isEditing && currentId) {
        // serviceApi.update ajoute déjà _method=PUT
        await serviceApi.update(currentId, dataToSend);
        setSuccessMsg("Service mis à jour avec succès !");
      } else {
        await serviceApi.create(dataToSend);
        setSuccessMsg("Service créé avec succès !");
      }

      setShowModal(false);
      fetchServices(currentPage);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentId) return;
    try {
      await serviceApi.delete(currentId);
      setSuccessMsg("Service supprimé avec succès !");
      setShowDeleteModal(false);
      fetchServices(currentPage);
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
                  <MdMiscellaneousServices size={28} />
                </div>
                Gestion des Services
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Gérez les services que vous proposez : sites web, applications web, et plus encore.
              </p>
            </div>
            <button
              className="btn fw-bold d-flex align-items-center justify-content-center shadow-lg px-4 py-2 text-white transition-all"
              onClick={handleOpenAddModal}
              style={{ backgroundColor: '#2563eb', borderRadius: '12px', border: 'none', transition: 'transform 0.2s' }}
            >
              <MdAdd size={22} className="me-2" /> Nouveau Service
            </button>
          </div>

          {/* Barre de Recherche */}
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

          {/* Tableau des Services */}
          <div className="card border-0 shadow-sm overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9' }} data-aos="fade-up" data-aos-delay="200">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ color: '#1e293b' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                    <tr>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Image</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Titre</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Description</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Prix min.</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Durée min.</th>
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
                    ) : filteredServices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">Aucun service trouvé.</td>
                      </tr>
                    ) : (
                      filteredServices.map((service) => (
                        <tr key={service.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                          <td className="py-3 px-4">
                            {service.image ? (
                              <img
                                src={getStorageUrl(service.image)}
                                alt={service.title}
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MdImage size={20} className="text-muted" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 fw-bold text-dark">{service.title}</td>
                          <td className="py-3 px-4 text-muted" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {service.description}
                          </td>
                          <td className="py-3 px-4">
                            <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '8px' }}>
                              {Number(service.min_price).toLocaleString('fr-FR')} €
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="badge px-3 py-2 fw-semibold" style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                              {service.min_duration}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button
                              className="btn btn-sm me-2 shadow-sm"
                              onClick={() => handleOpenEditModal(service)}
                              style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 10px' }}
                              title="Modifier"
                            >
                              <MdEdit size={16} />
                            </button>
                            <button
                              className="btn btn-sm shadow-sm"
                              onClick={() => { setCurrentId(service.id || null); setShowDeleteModal(true); }}
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
                <h5 className="modal-title fw-extrabold text-dark">{isEditing ? "Modifier le Service" : "Ajouter un Service"}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Titre du Service</label>
                    <input
                      type="text"
                      className="form-control shadow-none"
                      placeholder="Ex : Création de site web"
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
                      <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Prix minimum (€)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control shadow-none"
                        placeholder="300"
                        value={formData.min_price}
                        onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                        style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Durée minimum</label>
                      <input
                        type="text"
                        className="form-control shadow-none"
                        placeholder="Ex : 2 semaines"
                        value={formData.min_duration}
                        onChange={(e) => setFormData({ ...formData, min_duration: e.target.value })}
                        style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Image du service</label>
                    <input
                      type="file"
                      className="form-control shadow-none"
                      accept="image/*"
                      onChange={handleFileChange}
                      required={!isEditing}
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
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Voulez-vous vraiment supprimer ce service ? Cette action est irréversible.</p>
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