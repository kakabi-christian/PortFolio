// Models/Service.ts
// Models/Service.ts

export interface Service {
  id: number;
  title: string;
  description: string;
  image: string | null;
  min_price: string;
  min_duration: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedServices {
  data: Service[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}