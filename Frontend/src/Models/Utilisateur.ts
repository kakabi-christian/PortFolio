// src/Models/Utilisateur.ts

export interface Utilisateur {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at?: string;
    updated_at?: string;
}

export interface AuthResponse {
    message: string;
    user: Utilisateur;
    access_token: string;
    token_type: string;
}