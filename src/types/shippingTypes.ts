/**
 * Shipping Type Category
 * Used for visual grouping in UI
 */
export type ShippingTypeCategory = 'B2B' | 'B2C' | 'DEV/RET' | 'SPORADIC' | 'INTER';

/**
 * Audit information for shipping types
 */
export interface ShippingTypeAudit {
  created_by?: string;
  created_datetime?: string;
  updated_by?: string;
  updated_datetime?: string;
  migration_category_added?: string;
  migration_category_script?: string;
}

/**
 * Shipping Type document from MongoDB (V2 Schema)
 * V2 uses shipping_type_name instead of shipping_name
 */
export interface ShippingType {
  _id?: string;
  shipping_type_code: string;
  shipping_type_name: string;
  display_name: string;
  display_order?: number;
  rating_map: string;
  category: ShippingTypeCategory;
  is_active?: boolean;
  audit?: ShippingTypeAudit;
}

/**
 * Response from GET /shipping-types
 */
export interface ShippingTypesListResponse {
  shipping_types: ShippingType[];
  count: number;
}

/**
 * Payload for POST /v2/shipping-types (create)
 * V2 uses shipping_type_name instead of shipping_name
 */
export interface ShippingTypeCreatePayload {
  shipping_type_code: string;
  shipping_type_name: string;
  display_name: string;
  display_order?: number;
  rating_map: string;
  category?: ShippingTypeCategory; // Optional, defaults to 'B2C'
  is_active?: boolean; // Optional, defaults to true
  created_by?: string;
}

/**
 * Payload for PUT /v2/shipping-types/{code} (update)
 * V2 uses shipping_type_name instead of shipping_name
 */
export interface ShippingTypeUpdatePayload {
  shipping_type_name?: string;
  display_name?: string;
  display_order?: number;
  rating_map?: string;
  category?: ShippingTypeCategory;
  is_active?: boolean;
  updated_by?: string;
}

/**
 * Response from DELETE /shipping-types/{code}
 */
export interface ShippingTypeDeleteResponse {
  message: string;
  shipping_type_code: string;
}
