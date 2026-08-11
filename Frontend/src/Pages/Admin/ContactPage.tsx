import React, { useState, useEffect } from 'react';
import { 
  MdContacts, 
  MdDelete, 
  MdCheckCircle, 
  MdSearch,
  MdFilterList,
  MdEmail,
  MdReply,
  MdVisibility,
  MdSend
} from 'react-icons/md';
//@ts-ignore
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ContactService } from '../../Services/ContactService';
import type { Contact, ContactReplyData } from '../../Models/Contact';
import photo from '../../assets/ContactPeople.png'

export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recherche et Filtrage (si gérés côté API ou filtrage local)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

  // Modales
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Formulaire de réponse (aligné avec ContactReplyData: reply_message)
  const [replyData, setReplyData] = useState<ContactReplyData>({
    reply_message: ''
  });

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const fetchContacts = async (page = 1) => {
    try {
      setLoading(true);
      const data = await ContactService.getAll(page);
      // Adaptation selon la structure de pagination Laravel (data.data ou tableau direct)
      if (data.data) {
        setContacts(data.data);
        setCurrentPage(data.current_page || 1);
        setLastPage(data.last_page || 1);
      } else {
        setContacts(data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des contacts", err);
      setErrorMsg("Impossible de charger les messages de contact.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(currentPage);
  }, [currentPage]);

  const handleOpenViewModal = async (contact: Contact) => {
    if (!contact.id) return;
    try {
      // Récupérer le contact spécifique (ce qui marque automatiquement le message comme lu côté backend)
      const data = await ContactService.getById(contact.id);
      setCurrentContact(data);
      setShowViewModal(true);
      // Rafraîchir la liste pour refléter le statut "lu"
      fetchContacts(currentPage);
    } catch (err) {
      console.error("Erreur lors de la lecture du message", err);
      setErrorMsg("Impossible d'ouvrir le message.");
    }
  };

  const handleOpenReplyModal = (contact: Contact) => {
    setCurrentContact(contact);
    setCurrentId(contact.id || null);
    setReplyData({
      reply_message: ''
    });
    setShowReplyModal(true);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentId) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await ContactService.reply(currentId, replyData);
      setSuccessMsg("Réponse envoyée avec succès !");
      setShowReplyModal(false);
      fetchContacts(currentPage);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Une erreur est survenue lors de l'envoi de la réponse.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentId) return;
    try {
      await ContactService.destroy(currentId);
      setSuccessMsg("Message supprimé avec succès !");
      setShowDeleteModal(false);
      fetchContacts(currentPage);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg("Erreur lors de la suppression du message.");
    }
  };

  // Filtrage local optionnel basé sur la recherche et le statut
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = 
      c.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sender_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'unread') return matchesSearch && !c.is_read;
    if (filterStatus === 'read') return matchesSearch && c.is_read;
    return matchesSearch;
  });

  return (
    <div className="container-fluid py-5" style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: '#1e293b' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          
          {/* Header de la page */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3" data-aos="fade-down">
            <div>
              <h2 className="fw-extrabold mb-1 d-flex align-items-center text-dark" style={{ letterSpacing: '-0.5px' }}>
                <div className="p-2 rounded-3 me-3 shadow-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <MdContacts size={28} />
                </div>
                Gestion des Contacts & Messages
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Consultez, lisez et répondez aux messages envoyés par les visiteurs depuis le site.
              </p>
            </div>
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
                  placeholder="Rechercher par nom, email ou sujet..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '0 12px 12px 0', fontSize: '0.95rem' }}
                />
              </div>
              
              <div className="input-group" style={{ width: 'auto', minWidth: '220px' }}>
                <span className="input-group-text border-0" style={{ backgroundColor: '#f8fafc', color: '#64748b', borderRadius: '12px 0 0 12px' }}>
                  <MdFilterList size={22} />
                </span>
                <select 
                  className="form-select shadow-none border-0 py-2" 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '0 12px 12px 0', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  <option value="">Tous les messages</option>
                  <option value="unread">Non lus</option>
                  <option value="read">Lus</option>
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

          {/* Tableau des Contacts */}
          <div className="card border-0 shadow-sm overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9' }} data-aos="fade-up" data-aos-delay="200">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ color: '#1e293b' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                    <tr>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Statut</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Expéditeur</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Sujet</th>
                      <th className="py-3 px-4 text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>Date</th>
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
                    ) : filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-5 text-muted">Aucun message trouvé.</td>
                      </tr>
                    ) : (
                      filteredContacts.map((contact) => (
                        <tr key={contact.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', backgroundColor: contact.is_read ? 'transparent' : '#f8fafc' }}>
                          <td className="py-3 px-4">
                            {!contact.is_read ? (
                              <span className="badge px-2 py-1 fw-bold" style={{ backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.7rem' }}>
                                Nouveau
                              </span>
                            ) : (
                              <span className="badge px-2 py-1 fw-semibold" style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '6px', fontSize: '0.7rem' }}>
                                Lu
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="fw-bold text-dark">{contact.sender_name}</div>
                            <div className="text-muted" style={{ fontSize: '0.82rem' }}>{contact.sender_email}</div>
                          </td>
                          <td className="py-3 px-4 text-dark fw-medium">{contact.subject || 'Sans objet'}</td>
                          <td className="py-3 px-4 text-secondary" style={{ fontSize: '0.85rem' }}>
                            {contact.created_at ? new Date(contact.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-end">
                            <button 
                              className="btn btn-sm me-2 shadow-sm" 
                              onClick={() => handleOpenViewModal(contact)}
                              style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '8px 10px' }}
                              title="Voir le message"
                            >
                              <MdVisibility size={16} />
                            </button>
                            <button 
                              className="btn btn-sm me-2 shadow-sm" 
                              onClick={() => handleOpenReplyModal(contact)}
                              style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', padding: '8px 10px' }}
                              title="Répondre"
                            >
                              <MdReply size={16} />
                            </button>
                            <button 
                              className="btn btn-sm shadow-sm" 
                              onClick={() => { setCurrentId(contact.id || null); setShowDeleteModal(true); }}
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

      {/* MODAL DE CONSULTATION D'UN MESSAGE */}
      {showViewModal && currentContact && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', backgroundColor: '#ffffff', color: '#1e293b' }} data-aos="zoom-in">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-extrabold text-dark d-flex align-items-center">
                  <MdEmail className="me-2 text-primary" size={24} /> Détails du Message
                </h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowViewModal(false)} />
              </div>
              <div className="modal-body p-4">
                <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="row mb-2">
                    <div className="col-sm-3 fw-bold text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>EXPÉDITEUR</div>
                    <div className="col-sm-9 fw-bold text-dark">{currentContact.sender_name} ({currentContact.sender_email})</div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-sm-3 fw-bold text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>SUJET</div>
                    <div className="col-sm-9 text-dark">{currentContact.subject || 'Aucun sujet'}</div>
                  </div>
                  <div className="row">
                    <div className="col-sm-3 fw-bold text-secondary font-monospace" style={{ fontSize: '0.8rem' }}>DATE</div>
                    <div className="col-sm-9 text-muted" style={{ fontSize: '0.9rem' }}>
                      {currentContact.created_at ? new Date(currentContact.created_at).toLocaleString('fr-FR') : '-'}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Message</label>
                  <div className="p-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', minHeight: '120px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {currentContact.message}
                  </div>
                </div>

                {currentContact.reply_message && (
                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace text-success" style={{ fontSize: '0.75rem' }}>Réponse envoyée</label>
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', minHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {currentContact.reply_message}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button 
                  type="button" 
                  className="btn fw-bold px-4 py-2" 
                  onClick={() => setShowViewModal(false)}
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '12px', border: 'none' }}
                >
                  Fermer
                </button>
                <button 
                  type="button" 
                  className="btn fw-bold px-4 py-2 shadow-sm text-white" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenReplyModal(currentContact);
                  }}
                  style={{ backgroundColor: '#16a34a', borderRadius: '12px', border: 'none' }}
                >
                  <MdReply className="me-1" size={18} /> Répondre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RÉPONSE */}
      {showReplyModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', backgroundColor: '#ffffff', color: '#1e293b' }} data-aos="zoom-in">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-extrabold text-dark">Répondre à {currentContact?.sender_name}</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowReplyModal(false)} />
              </div>
              <form onSubmit={handleReplySubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Destinataire</label>
                    <input 
                      type="text" 
                      className="form-control shadow-none" 
                      value={currentContact?.sender_email || ''} 
                      disabled 
                      style={{ backgroundColor: '#f8fafc', color: '#64748b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-uppercase text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>Message de réponse</label>
                    <textarea 
                      className="form-control shadow-none" 
                      rows={5}
                      value={replyData.reply_message}
                      onChange={(e) => setReplyData({ ...replyData, reply_message: e.target.value })}
                      placeholder="Rédigez votre réponse ici..."
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0' }}
                      required 
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button 
                    type="button" 
                    className="btn fw-bold px-4 py-2" 
                    onClick={() => setShowReplyModal(false)}
                    style={{ backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '12px', border: 'none' }}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn fw-bold px-4 py-2 shadow-sm text-white" 
                    style={{ backgroundColor: '#16a34a', borderRadius: '12px', border: 'none' }}
                  >
                    <MdSend className="me-1" size={18} /> Envoyer la réponse
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
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Voulez-vous vraiment supprimer ce message ? Cette action est irréversible.</p>
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
                    Supprimerve
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