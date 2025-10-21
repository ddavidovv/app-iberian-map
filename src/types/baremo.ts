/**
 * Baremo types for rate model configuration
 */

/**
 * Individual baremo (rate category) within a group
 */
export interface Baremo {
  baremo_id: string;
  code: string;
  name: string;
  display_order: number;
}

/**
 * Group of related baremos
 */
export interface BaremoGroup {
  group_id: string;
  code: string;
  name: string;
  display_order: number;
  baremos: Baremo[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

/**
 * Paginated list response for baremo groups
 */
export interface BaremoGroupListResponse {
  items: BaremoGroup[];
  pagination: {
    total: number;
    count: number;
    limit: number;
    offset: number;
  };
}

/**
 * Request payload for creating a new baremo group
 */
export interface BaremoGroupCreateRequest {
  code: string;
  name: string;
  display_order?: number;
  baremos?: Baremo[];
  created_by?: string;
  group_id?: string;
}

/**
 * Request payload for updating a baremo group
 */
export interface BaremoGroupUpdateRequest {
  code?: string;
  name?: string;
  display_order?: number;
  baremos?: Baremo[];
  updated_by?: string;
}

/**
 * Request payload for adding a baremo to a group
 */
export interface BaremoCreateRequest {
  code: string;
  name: string;
  display_order: number;
  updated_by?: string;
  baremo_id?: string;
}

/**
 * Product availability map within a baremo
 * Keys are product codes, values are availability boolean
 */
export type ProductAvailability = Record<string, boolean>;

/**
 * Configuration for a specific baremo within the matrix
 */
export interface BaremoConfig {
  baremo_id: string;
  baremo_code: string;
  baremo_name: string;
  product_availability: ProductAvailability;
}

/**
 * Configuration for an entire baremo group within the matrix
 */
export interface BaremoGroupConfig {
  baremo_group_id: string;
  baremo_group_code: string;
  baremo_group_name: string;
  baremos: BaremoConfig[];
}

/**
 * Complete baremo matrix for a rate model
 */
export interface RateModelBaremoMatrix {
  matrix_id: string | null;
  rate_model_id: string;
  baremo_configurations: BaremoGroupConfig[];
  created_at: string | null;
  updated_at: string | null;
  created_by?: string;
  updated_by?: string;
}

/**
 * Request payload for updating the entire matrix
 */
export interface RateModelBaremoMatrixUpdateRequest {
  baremo_configurations: BaremoGroupConfig[];
  updated_by?: string;
}

/**
 * Request payload for adding a baremo group to the matrix
 */
export interface AddBaremoGroupToMatrixRequest {
  baremo_group_id: string;
  updated_by?: string;
}

/**
 * Request payload for updating product availability
 */
export interface UpdateProductAvailabilityRequest {
  is_available: boolean;
  updated_by?: string;
}

/**
 * Request payload for cloning a matrix
 */
export interface CloneBaremoMatrixRequest {
  source_model_id: string;
  updated_by?: string;
}
