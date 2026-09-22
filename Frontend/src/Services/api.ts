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
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${STORAGE_URL}/${path.replace(/^\/+/, '')}`;
};

// Intercepteur pour injecter le token Bearer et logger les requêtes sortantes
api.interceptors.request.use((config: any) => {
    config.metadata = { startTime: new Date() };

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 [REQUÊTE AXIOS] -> [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);
    if (config.data) {
        console.log("📦 Payload :", config.data);
    }
    
    return config;
}, (error) => {
    console.error("❌ [ERREUR REQUÊTE] :", error);
    return Promise.reject(error);
});

// Intercepteur de réponse pour parser automatiquement le JSON si Laravel renvoie du texte brut
api.interceptors.response.use(
    (response: any) => {
        const endTime = new Date();
        const duration = endTime.getTime() - response.config.metadata.startTime.getTime();

        // 🛡️ CORRECTION MAGIQUE : Si Laravel renvoie accidentellement du texte/string, on le parse en JSON
        if (typeof response.data === 'string') {
            try {
                // Nettoyage au cas où des balises markdown ou des espaces se glisseraient
                const cleaned = response.data.replace(/```php|```/g, '').trim();
                response.data = JSON.parse(cleaned);
                // console.warn("⚠️ [AXIOS] La réponse du serveur était une String, convertie avec succès en Objet JSON.");
            } catch (e) {
                console.error("❌ [AXIOS] Impossible de parser la réponse brute en JSON :", response.data);
            }
        }

        console.log(`✅ [RÉPONSE SUCCÈS] <- [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, response.data);

        return response;
    },
    (error) => {
        console.group(`❌ [ERREUR RÉPONSE HTTP] sur l'URL : ${error.config?.baseURL}${error.config?.url}`);
        if (error.response) {
            console.error("📊 Code Statut HTTP :", error.response.status);
            console.error("📥 Données d'erreur :", error.response.data);
        } else {
            console.error("🔌 Erreur réseau ou serveur inaccessible :", error.message);
        }
        console.groupEnd();

        return Promise.reject(error);
    }
);

export default api;