// Models/Database.ts
// Models/Database.ts

export interface Database {
    id: number;
    name: string;
    type: 'Relationnelle' | 'NoSQL';
    level: string;
    icon?: string | null; // Chemin ou URL de l'icône / image
    created_at?: string;
    updated_at?: string;
}

// Interface pour gérer la réponse paginée de l'API Laravel
export interface PaginatedDatabaseResponse {
    status: string;
    data: {
        current_page: number;
        data: Database[];
        first_page_url: string;
        from: number | null;
        last_page: number;
        last_page_url: string;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        next_page_url: string | null;
        path: string;
        per_page: number;
        prev_page_url: string | null;
        to: number | null;
        total: number;
    };
}