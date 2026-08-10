// src/Models/Tool.ts
export interface Tool {
  id?: number;
  name: string;
  category: 'DevOps' | 'Design' | 'Versioning' | 'Testing' | 'Autre';
  level?: string;
  icon: File | string | null;
  created_at?: string;
  updated_at?: string;
}