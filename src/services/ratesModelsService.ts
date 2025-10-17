import type {
  RatesModel,
  RatesModelListResponse,
  RatesModelCreatePayload,
  RatesModelUpdatePayload,
  RatesModelDeleteResponse,
  RatesModelStatus
} from '../types/ratesModels';

type ListParams = {
  status?: RatesModelStatus | 'all';
  search?: string;
  limit?: number;
  offset?: number;
};

const DEFAULT_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json'
};

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = new URL(`${base}${path}`);

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (typeof value === 'boolean') {
        searchParams.set(key, value ? 'true' : 'false');
        return;
      }
      searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();
    if (queryString) {
      url.search = queryString;
    }
  }

  return url.toString();
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

export const ratesModelsService = {
  async list(params: ListParams = {}): Promise<RatesModelListResponse> {
    const query: Record<string, unknown> = {};
    if (params.status && params.status !== 'all') {
      query.status = params.status;
    }
    if (params.search) {
      query.search = params.search;
    }
    if (typeof params.limit === 'number') {
      query.limit = params.limit;
    }
    if (typeof params.offset === 'number') {
      query.offset = params.offset;
    }

    const response = await fetch(buildUrl('/rates-models', query));
    return handleResponse<RatesModelListResponse>(response);
  },

  async get(modelId: string): Promise<RatesModel> {
    const response = await fetch(buildUrl(`/rates-models/${modelId}`));
    return handleResponse<RatesModel>(response);
  },

  async create(payload: RatesModelCreatePayload): Promise<RatesModel> {
    const response = await fetch(buildUrl('/rates-models'), {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse<RatesModel>(response);
  },

  async update(modelId: string, payload: RatesModelUpdatePayload): Promise<RatesModel> {
    const response = await fetch(buildUrl(`/rates-models/${modelId}`), {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse<RatesModel>(response);
  },

  async archive(
    modelId: string,
    params: { hard?: boolean; updated_by?: string } = {}
  ): Promise<RatesModelDeleteResponse> {
    const response = await fetch(
      buildUrl(`/rates-models/${modelId}`, {
        hard: params.hard,
        updated_by: params.updated_by
      }),
      { method: 'DELETE' }
    );
    return handleResponse<RatesModelDeleteResponse>(response);
  }
};
