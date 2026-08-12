// src/Services/ProjectService.ts
import api from "./api";
import type { Project } from "../Models/Project";

export const ProjectService = {
  // Récupérer tous les projets avec support optionnel de la pagination
  async getAll(page: number = 1): Promise<any> {
    const response = await api.get(`/projects?page=${page}`);
    return response.data;
  },

  // Récupérer un projet spécifique par son ID ou son slug
  async getBySlugOrId(idOrSlug: string | number): Promise<Project> {
    const response = await api.get(`/projects/${idOrSlug}`);
    return response.data.data || response.data;
  },

  // Créer un nouveau projet (avec support des fichiers via FormData)
  async create(formData: FormData): Promise<Project> {
    const response = await api.post('/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  // Mettre à jour un projet existant (avec support des fichiers via FormData et _method PUT)
  async update(idOrSlug: string | number, formData: FormData): Promise<Project> {
    // On utilise POST car certains serveurs/proxies bloquent les fichiers sur les méthodes PUT
    // Laravel traitera cela comme un PUT grâce au champ _method: 'PUT' dans le formData
    const response = await api.post(`/projects/${idOrSlug}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  // Supprimer un projet (admin)
  async delete(idOrSlug: string | number): Promise<void> {
    await api.delete(`/projects/${idOrSlug}`);
  }
};