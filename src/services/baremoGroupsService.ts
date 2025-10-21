/**
 * Service for managing baremo groups via the API
 */

import type {
  BaremoGroup,
  BaremoGroupListResponse,
  BaremoGroupCreateRequest,
  BaremoGroupUpdateRequest,
  BaremoCreateRequest,
} from '../types/baremo';

// Base API URL - adjust based on your environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Fetch a paginated list of baremo groups
 */
export async function listBaremoGroups(
  search?: string,
  limit: number = 50,
  offset: number = 0
): Promise<BaremoGroupListResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/baremo-groups?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list baremo groups');
  }

  return response.json();
}

/**
 * Create a new baremo group
 */
export async function createBaremoGroup(
  data: BaremoGroupCreateRequest
): Promise<BaremoGroup> {
  const response = await fetch(`${API_BASE_URL}/baremo-groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create baremo group');
  }

  return response.json();
}

/**
 * Get a single baremo group by ID
 */
export async function getBaremoGroup(groupId: string): Promise<BaremoGroup> {
  const response = await fetch(`${API_BASE_URL}/baremo-groups/${groupId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get baremo group');
  }

  return response.json();
}

/**
 * Update an existing baremo group
 */
export async function updateBaremoGroup(
  groupId: string,
  data: BaremoGroupUpdateRequest
): Promise<BaremoGroup> {
  const response = await fetch(`${API_BASE_URL}/baremo-groups/${groupId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update baremo group');
  }

  return response.json();
}

/**
 * Delete a baremo group
 */
export async function deleteBaremoGroup(
  groupId: string,
  updatedBy?: string
): Promise<{ message: string }> {
  const params = new URLSearchParams();
  if (updatedBy) params.append('updated_by', updatedBy);

  const response = await fetch(
    `${API_BASE_URL}/baremo-groups/${groupId}?${params}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete baremo group');
  }

  return response.json();
}

/**
 * Add a baremo to an existing group
 */
export async function addBaremoToGroup(
  groupId: string,
  data: BaremoCreateRequest
): Promise<BaremoGroup> {
  const response = await fetch(
    `${API_BASE_URL}/baremo-groups/${groupId}/baremos`,
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
    throw new Error(error.error || 'Failed to add baremo to group');
  }

  return response.json();
}

/**
 * Delete a baremo from a group
 */
export async function deleteBaremoFromGroup(
  groupId: string,
  baremoId: string,
  updatedBy?: string
): Promise<BaremoGroup> {
  const params = new URLSearchParams();
  if (updatedBy) params.append('updated_by', updatedBy);

  const response = await fetch(
    `${API_BASE_URL}/baremo-groups/${groupId}/baremos/${baremoId}?${params}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete baremo from group');
  }

  return response.json();
}
