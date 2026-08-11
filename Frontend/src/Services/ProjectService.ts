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

  // Créer un nouveau projet (admin)
  async create(projectData: Project): Promise<Project> {
    const response = await api.post('/projects', projectData);
    return response.data.data || response.data;
  },

  // Mettre à jour un projet existant (admin)
  async update(idOrSlug: string | number, projectData: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${idOrSlug}`, projectData);
    return response.data.data || response.data;
  },

  // Supprimer un projet (admin)
  async delete(idOrSlug: string | number): Promise<void> {
    await api.delete(`/projects/${idOrSlug}`);
  }
};