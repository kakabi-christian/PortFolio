// src/Models/Statistic.ts

export interface Overview {
  total_contacts: number;
  total_projects: number;
  total_services: number;
  total_frameworks: number;
  total_databases: number;
  total_tools: number;
  total_users: number;
}

export interface ContactStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  not_replied: number;
  reply_rate: number; // en pourcentage
  today: number;
  this_week: number;
  this_month: number;
}

export interface ProjectStats {
  total: number;
  featured: number;
  with_github: number;
  with_demo: number;
}

export interface CategoryCount {
  category: string;
  total: number;
}

export interface TypeCount {
  type: string;
  total: number;
}

export interface RoleCount {
  role: string;
  total: number;
}

export interface SkillStats {
  frameworks: {
    total: number;
    by_category: CategoryCount[];
    avg_proficiency: number;
  };
  databases: {
    total: number;
    by_type: TypeCount[];
  };
  tools: {
    total: number;
    by_category: CategoryCount[];
  };
}

export interface ServiceStats {
  total: number;
  // Laravel peut renvoyer ces valeurs en string selon le type de colonne
  min_price: number | string | null;
  max_price: number | string | null;
  avg_price: number;
}

export interface UserStats {
  total: number;
  by_role: RoleCount[];
}

export interface MonthlyCount {
  month: string; // format "YYYY-MM"
  total: number;
}

export interface LatestContact {
  id: number;
  sender_name: string;
  sender_email: string;
  subject: string;
  is_read: boolean;
  created_at: string;
}

export interface LatestProject {
  id: number;
  title: string;
  slug: string;
  image_url: string | null;
  featured: boolean;
  created_at: string;
}

export interface StatisticData {
  overview: Overview;
  contacts: ContactStats;
  projects: ProjectStats;
  skills: SkillStats;
  services: ServiceStats;
  users: UserStats;
  charts: {
    contacts_per_month: MonthlyCount[];
    projects_per_month: MonthlyCount[];
  };
  latest: {
    contacts: LatestContact[];
    projects: LatestProject[];
  };
}

export interface StatisticResponse {
  success: boolean;
  data: StatisticData;
}