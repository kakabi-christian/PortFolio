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

// LOG DE DÉBUG : Vérifie ce que Vite charge réellement au démarrage
console.log("🔍 VITE_API_BASE_URL configurée :", import.meta.env.VITE_API_BASE_URL);

// Intercepteur pour injecter le token Bearer s'il existe dans le localStorage et logger les requêtes
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // LOG DE DÉBUG : Affiche l'URL exacte appelée par Axios (baseURL + url)
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