import type {
  RatingZone,
  RatingZonesResponse,
  UpdateZoneCodeParams,
  UpdateZoneCodeResponse,
} from '../types/mapApi';

// Base URL for the API - adjust according to environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Updates the zone code (baremo) for a specific route and shipping product
 */
export async function updateRouteZoneCode(
  params: UpdateZoneCodeParams
): Promise<UpdateZoneCodeResponse> {
  const {
    originZoneCode,
    destinZoneCode,
    shippingTypeCode,
    mapCode,
    newZoneCode,
    updatedBy = 'Frontend',
  } = params;

  // Build query parameters
  const queryParams = new URLSearchParams({
    origin_zone_code: originZoneCode,
    destin_zone_code: destinZoneCode,
  });

  if (shippingTypeCode) {
    queryParams.append('shipping_type_code', shippingTypeCode);
  }

  if (mapCode) {
    queryParams.append('map_code', mapCode);
  }

  // Build request body
  const requestBody = {
    new_zone_code: newZoneCode,
    updated_by: updatedBy,
  };

  const url = `${API_BASE_URL}/map/route-zone?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating zone code:', error);
    throw error;
  }
}

/**
 * Fetches the catalog of rating zones (baremos) available in the system
 */
export async function fetchRatingZones(): Promise<RatingZone[]> {
  const url = `${API_BASE_URL}/map/ratingZones`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error while loading rating zones: ${response.status}`
      );
    }

    const data: RatingZonesResponse = await response.json();
    return data.zones ?? [];
  } catch (error) {
    console.error('Error fetching rating zones:', error);
    throw error;
  }
}
