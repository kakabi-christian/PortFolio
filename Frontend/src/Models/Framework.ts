// src/Models/Framework.ts
export interface Framework {
  id?: number;
  name: string;
  category: string;
  proficiency: number;
  icon?: string | File;
  created_at?: string;
  updated_at?: string;
}