// src/Services/ContactService.ts
import api from "./api";
import type { Contact, ContactFormData, ContactReplyData } from "../Models/Contact";

export const ContactService = {
  /**
   * Récupérer tous les contacts (avec pagination)
   */
  getAll: async (page: number = 1) => {
    const response = await api.get(`/admin/contacts?page=${page}`);
    return response.data;
  },

  /**
   * Compter les messages non lus
   */
  getUnreadCount: async () => {
    const response = await api.get("/admin/contacts/count/unread");
    return response.data;
  },

  /**
   * Voir un message spécifique (marqué automatiquement comme lu)
   */
  getById: async (id: number) => {
    const response = await api.get(`/admin/contacts/${id}`);
    return response.data;
  },

  /**
   * Envoyer un nouveau message (Formulaire public)
   */
  store: async (data: ContactFormData) => {
    const response = await api.post("/contact", data);
    return response.data;
  },

  /**
   * Répondre à un message (Dashboard Admin)
   */
  reply: async (id: number, data: ContactReplyData) => {
    const response = await api.post(`/admin/contacts/${id}/reply`, data);
    return response.data;
  },

  /**
   * Supprimer un message
   */
  destroy: async (id: number) => {
    const response = await api.delete(`/admin/contacts/${id}`);
    return response.data;
  }
};