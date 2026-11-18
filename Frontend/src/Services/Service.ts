// services/Service.ts
import api from "./api";
import type { PaginatedServices, Service } from "../Models/Service";

export const serviceApi = {
  // Public (site web, sans token)
  getAll: async (page = 1, perPage = 6): Promise<PaginatedServices> => {
    const response = await api.get("/services", {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // Admin (token Sanctum + rôle admin)
  getAllAdmin: async (page = 1, perPage = 6): Promise<PaginatedServices> => {
    const response = await api.get("/admin/services", {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  getByIdAdmin: async (id: number): Promise<Service> => {
    const response = await api.get(`/admin/services/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<Service> => {
    const response = await api.post("/services", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  update: async (id: number, formData: FormData): Promise<Service> => {
    // Laravel ne lit pas les fichiers en PUT multipart : POST + _method
    formData.append("_method", "PUT");
    const response = await api.post(`/services/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};