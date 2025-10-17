export type RatesModelStatus = 'draft' | 'active' | 'archived';

export interface RatesModelProduct {
  product_code: string;
  product_name?: string;
  is_available: boolean;
  is_required: boolean;
  notes?: string;
}

export interface RatesModelActivity {
  timestamp: string;
  user?: string;
  action: string;
  details?: string;
}

export interface RatesModel {
  model_id: string;
  name: string;
  description?: string | null;
  status: RatesModelStatus;
  notes?: string | null;
  products: RatesModelProduct[];
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  activity_log?: RatesModelActivity[];
}

export interface RatesModelListResponse {
  items: RatesModel[];
  pagination: {
    total: number;
    count: number;
    limit: number;
    offset: number;
  };
}

export interface RatesModelCreatePayload {
  name: string;
  description?: string | null;
  status?: RatesModelStatus;
  notes?: string | null;
  products: RatesModelProduct[];
  created_by?: string;
  initial_activity?: string;
}

export interface RatesModelUpdatePayload {
  name?: string;
  description?: string | null;
  status?: RatesModelStatus;
  notes?: string | null;
  products?: RatesModelProduct[];
  updated_by?: string;
  change_message?: string;
}

export interface RatesModelDeleteResponse {
  message: string;
  model?: RatesModel | null;
}
