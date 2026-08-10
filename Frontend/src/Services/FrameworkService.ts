import api from "./api";
import type { Framework } from "../Models/Framework";

export const frameworkService = {
  // Récupérer tous les frameworks (avec support de la pagination, de la recherche et du filtre par catégorie)
  async getAll(page = 1, search = '', category = '', perPage = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (search) {
      params.append('search', search);
    }
    if (category) {
      params.append('category', category);
    }

    const response = await api.get(`/frameworks?${params.toString()}`);
    return response.data;
  },

  // Récupérer un framework par son ID
  async getById(id: number) {
    const response = await api.get(`/frameworks/${id}`);
    return response.data;
  },

  // Créer un nouveau framework (avec upload d'image)
  async create(frameworkData: Framework) {
    const formData = new FormData();
    formData.append('name', frameworkData.name);
    formData.append('category', frameworkData.category);
    formData.append('proficiency', frameworkData.proficiency.toString());
    
    if (frameworkData.icon instanceof File) {
      formData.append('icon', frameworkData.icon);
    }

    const response = await api.post('/frameworks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Mettre à jour un framework (utilisation de _method: 'PUT' pour Laravel avec multipart/form-data)
  async update(id: number, frameworkData: Framework) {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('name', frameworkData.name);
    formData.append('category', frameworkData.category);
    formData.append('proficiency', frameworkData.proficiency.toString());

    if (frameworkData.icon instanceof File) {
      formData.append('icon', frameworkData.icon);
    }

    const response = await api.post(`/frameworks/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Supprimer un framework
  async delete(id: number) {
    const response = await api.delete(`/frameworks/${id}`);
    return response.data;
  },
};