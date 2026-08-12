// src/Services/ToolService.ts
import api from "./api";

export const toolService = {
  // Récupérer la liste des outils avec pagination
  getAll: async (page: number = 1, perPage: number = 10) => {
    return await api.get(`/tools?page=${page}&per_page=${perPage}`);
  },

  // Récupérer un outil spécifique par son ID
  getById: async (id: number) => {
    return await api.get(`/tools/${id}`);
  },

  // Créer un nouvel outil (avec support des fichiers/icônes via FormData)
  create: async (formData: FormData) => {
    return await api.post('/tools', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Mettre à jour un outil existant
  update: async (id: number, formData: FormData) => {
    // Si l'API utilise POST avec _method=PUT pour le multipart, ou PUT direct selon votre configuration Laravel :
    return await api.post(`/tools/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Supprimer un outil
  delete: async (id: number) => {
    return await api.delete(`/tools/${id}`);
  },
};