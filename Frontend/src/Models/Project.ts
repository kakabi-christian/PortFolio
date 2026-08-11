// src/Models/Project.ts

export interface Project {
  id?: number;
  title: string;
  slug?: string;
  description: string;
  image_url?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}