// src/services/authService.ts

import api from './api';
import type { AuthResponse, Utilisateur } from '../Models/Utilisateur';

interface LoginCredentials {
    email: string;
    password: string;
}

export const authService = {
    // Connexion
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/login', credentials);
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Déconnexion
    async logout(): Promise<void> {
        try {
            await api.post('/logout');
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
    },

    // Récupérer l'utilisateur connecté
    async getCurrentUser(): Promise<Utilisateur> {
        const response = await api.get<Utilisateur>('/user');
        return response.data;
    },

    // Vérifier si l'utilisateur est authentifié
    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    }
};