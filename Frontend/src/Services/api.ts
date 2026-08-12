// src/services/api.ts

import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// EXPORT DE L'URL DE STOCKAGE
export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL;

// Helper global pour générer l'URL complète d'une image/icône
export const getStorageUrl = (path?: string | null) => {
    if (!path) return undefined;
    // Si le chemin commence déjà par http ou https, on le retourne tel quel
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${STORAGE_URL}/${path.replace(/^\/+/, '')}`;
};

// LOGS DE DÉBUG
console.log("🔍 VITE_API_BASE_URL configurée :", import.meta.env.VITE_API_BASE_URL);
console.log("🔍 VITE_STORAGE_URL configurée :", STORAGE_URL);

// Intercepteur pour injecter le token Bearer s'il existe dans le localStorage et logger les requêtes
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 Requête Axios sortante vers -> [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);
    
    return config;
}, (error) => {
    console.error("❌ Erreur dans l'intercepteur de requête :", error);
    return Promise.reject(error);
});

// Intercepteur de réponse pour logger les erreurs 404 ou autres
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error(`❌ Erreur Réponse HTTP [${error.response.status}] sur l'URL :`, error.config?.url);
            console.error("Détails de l'erreur :", error.response.data);
        } else {
            console.error("❌ Erreur Réseau ou Serveur inaccessible :", error.message);
        }
        return Promise.reject(error);
    }
);

export default api;