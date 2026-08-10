// Services/DatabaseService.ts

import api from "./api";
import type { Database, PaginatedDatabaseResponse } from "../Models/Database";

export const databaseService = {
    // Récupérer la liste paginée des bases de données
    async getAll(page: number = 1, perPage: number = 10): Promise<PaginatedDatabaseResponse> {
        const response = await api.get<PaginatedDatabaseResponse>(`/databases?page=${page}&per_page=${perPage}`);
        return response.data;
    },

    // Récupérer une base de données spécifique par son ID
    async getById(id: number): Promise<{ status: string; data: Database }> {
        const response = await api.get<{ status: string; data: Database }>(`/databases/${id}`);
        return response.data;
    },

    // Créer une nouvelle base de données (avec gestion du fichier icône via FormData)
    async create(formData: FormData): Promise<{ status: string; message: string; data: Database }> {
        const response = await api.post<{ status: string; message: string; data: Database }>(
            '/databases', 
            formData, 
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // Mettre à jour une base de données (Utilisation de POST avec _method = PUT pour supporter l'envoi de fichiers dans Laravel)
    async update(id: number, formData: FormData): Promise<{ status: string; message: string; data: Database }> {
        // Laravel nécessite souvent _method: 'PUT' dans un FormData pour les requêtes multipart de mise à jour
        formData.append('_method', 'PUT');

        const response = await api.post<{ status: string; message: string; data: Database }>(
            `/databases/${id}`, 
            formData, 
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // Supprimer une base de données
    async delete(id: number): Promise<{ status: string; message: string }> {
        const response = await api.delete<{ status: string; message: string }>(`/databases/${id}`);
        return response.data;
    },
};