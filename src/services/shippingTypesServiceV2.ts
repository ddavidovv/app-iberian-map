import type {
  ShippingType,
  ShippingTypesListResponse,
  ShippingTypeCreatePayload,
  ShippingTypeUpdatePayload,
  ShippingTypeDeleteResponse
} from '../types/shippingTypes';

const DEFAULT_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json'
};

function buildUrl(path: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${path}`;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (!response.ok) {
    const errorPayload = isJson ? await response.json() : { error: await response.text() };
    const message = (errorPayload && (errorPayload.error || errorPayload.message)) ?? 'Error inesperado';
    throw new Error(message);
  }
  if (!isJson) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

interface SyncResponse {
  message: string;
  legacy_count: number;
  v2_count: number;
  migrated: number;
  updated: number;
  errors: number;
  error_details?: Array<{ shipping_type_code: string; error: string }>;
}

/**
 * Service for accessing shipping types from the v2 API (ecommerce-contract-staging database)
 * These endpoints query the new v2 database structure with improved schema
 */
export const shippingTypesServiceV2 = {
  /**
   * Get all shipping types from v2 database
   */
  async list(): Promise<ShippingTypesListResponse> {
    const response = await fetch(buildUrl('/v2/shipping-types'));
    return handleResponse<ShippingTypesListResponse>(response);
  },

  /**
   * Get a single shipping type by code from v2 database
   */
  async get(shippingTypeCode: string): Promise<ShippingType> {
    const response = await fetch(buildUrl(`/v2/shipping-types/${shippingTypeCode}`));
    return handleResponse<ShippingType>(response);
  },

  /**
   * Create a new shipping type in v2 database
   */
  async create(payload: ShippingTypeCreatePayload): Promise<ShippingType> {
    const response = await fetch(buildUrl('/v2/shipping-types'), {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    const result = await handleResponse<{ shipping_type: ShippingType; message: string }>(response);
    return result.shipping_type;
  },

  /**
   * Update an existing shipping type in v2 database
   */
  async update(shippingTypeCode: string, payload: ShippingTypeUpdatePayload): Promise<ShippingType> {
    const response = await fetch(buildUrl(`/v2/shipping-types/${shippingTypeCode}`), {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    const result = await handleResponse<{ shipping_type: ShippingType; message: string }>(response);
    return result.shipping_type;
  },

  /**
   * Delete a shipping type from v2 database
   */
  async delete(shippingTypeCode: string): Promise<ShippingTypeDeleteResponse> {
    const response = await fetch(buildUrl(`/v2/shipping-types/${shippingTypeCode}`), {
      method: 'DELETE'
    });
    return handleResponse<ShippingTypeDeleteResponse>(response);
  },

  /**
   * Sync shipping types from legacy database (masterShippingTypes) to v2 (shipping_types)
   * This endpoint allows manual synchronization without running the migration script
   *
   * @returns Sync status including migration counts and any errors
   */
  async syncFromLegacy(): Promise<SyncResponse> {
    const response = await fetch(buildUrl('/v2/shipping-types/sync'), {
      method: 'POST',
      headers: JSON_HEADERS
    });
    return handleResponse<SyncResponse>(response);
  }
};
