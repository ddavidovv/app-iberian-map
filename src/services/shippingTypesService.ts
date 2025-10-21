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

export const shippingTypesService = {
  /**
   * Get all shipping types from MongoDB
   */
  async list(): Promise<ShippingTypesListResponse> {
    const response = await fetch(buildUrl('/shipping-types'));
    return handleResponse<ShippingTypesListResponse>(response);
  },

  /**
   * Get a single shipping type by code
   */
  async get(shippingTypeCode: string): Promise<ShippingType> {
    const response = await fetch(buildUrl(`/shipping-types/${shippingTypeCode}`));
    return handleResponse<ShippingType>(response);
  },

  /**
   * Create a new shipping type
   */
  async create(payload: ShippingTypeCreatePayload): Promise<ShippingType> {
    const response = await fetch(buildUrl('/shipping-types'), {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    const result = await handleResponse<{ shipping_type: ShippingType; message: string }>(response);
    return result.shipping_type;
  },

  /**
   * Update an existing shipping type
   */
  async update(shippingTypeCode: string, payload: ShippingTypeUpdatePayload): Promise<ShippingType> {
    const response = await fetch(buildUrl(`/shipping-types/${shippingTypeCode}`), {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    const result = await handleResponse<{ shipping_type: ShippingType; message: string }>(response);
    return result.shipping_type;
  },

  /**
   * Delete a shipping type
   */
  async delete(shippingTypeCode: string): Promise<ShippingTypeDeleteResponse> {
    const response = await fetch(buildUrl(`/shipping-types/${shippingTypeCode}`), {
      method: 'DELETE'
    });
    return handleResponse<ShippingTypeDeleteResponse>(response);
  }
};
