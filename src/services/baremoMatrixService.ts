/**
 * Service for managing rate model baremo matrix via the API
 */

import type {
  RateModelBaremoMatrix,
  RateModelBaremoMatrixUpdateRequest,
  AddBaremoGroupToMatrixRequest,
  UpdateProductAvailabilityRequest,
  CloneBaremoMatrixRequest,
} from '../types/baremo';

// Base API URL - adjust based on your environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Get the baremo matrix for a specific rate model
 */
export async function getRateModelBaremoMatrix(
  modelId: string
): Promise<RateModelBaremoMatrix> {
  const response = await fetch(
    `${API_BASE_URL}/rates-models/${modelId}/baremo-matrix`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get baremo matrix');
  }

  return response.json();
}

/**
 * Update the entire baremo matrix for a rate model
 */
export async function updateRateModelBaremoMatrix(
  modelId: string,
  data: RateModelBaremoMatrixUpdateRequest
): Promise<RateModelBaremoMatrix> {
  const response = await fetch(
    `${API_BASE_URL}/rates-models/${modelId}/baremo-matrix`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update baremo matrix');
  }

  return response.json();
}

/**
 * Add a baremo group to the rate model's matrix
 */
export async function addBaremoGroupToMatrix(
  modelId: string,
  data: AddBaremoGroupToMatrixRequest
): Promise<RateModelBaremoMatrix> {
  const response = await fetch(
    `${API_BASE_URL}/rates-models/${modelId}/baremo-matrix/groups`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add baremo group to matrix');
  }

  return response.json();
}

/**
 * Remove a baremo group from the rate model's matrix
 */
export async function removeBaremoGroupFromMatrix(
  modelId: string,
  baremoGroupId: string,
  updatedBy?: string
): Promise<RateModelBaremoMatrix> {
  const params = new URLSearchParams();
  if (updatedBy) params.append('updated_by', updatedBy);

  const response = await fetch(
    `${API_BASE_URL}/rates-models/${modelId}/baremo-matrix/groups/${baremoGroupId}?${params}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove baremo group from matrix');
  }

  return response.json();
}

/**
 * Update product availability for a specific baremo
 */
export async function updateProductAvailability(
  modelId: string,
  baremoGroupId: string,
  baremoId: string,
  productCode: string,
  data: UpdateProductAvailabilityRequest
): Promise<RateModelBaremoMatrix> {
  const response = await fetch(
    `${API_BASE_URL}/rates-models/${modelId}/baremo-matrix/groups/${baremoGroupId}/baremos/${baremoId}/products/${productCode}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update product availability');
  }

  return response.json();
}

/**
 * Clone baremo matrix from another rate model
 */
export async function cloneBaremoMatrix(
  targetModelId: string,
  data: CloneBaremoMatrixRequest
): Promise<RateModelBaremoMatrix> {
  const response = await fetch(
    `${API_BASE_URL}/rates-models/${targetModelId}/baremo-matrix/clone`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clone baremo matrix');
  }

  return response.json();
}
