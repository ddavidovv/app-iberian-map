// Types for Map API endpoints

export interface UpdateZoneCodeRequest {
  new_zone_code: string;
  updated_by?: string;
}

export interface RouteInfo {
  origin_zone_code: string;
  origin_zone_name?: string;
  destin_zone_code: string;
  destin_zone_name?: string;
}

export interface UpdateZoneCodeResponse {
  message: string;
  route: RouteInfo;
  field_updated: string;
  old_zone_code: string;
  new_zone_code: string;
  updated_by: string;
  updated_at: string;
  shipping_entry_updated?: boolean;
}

export interface UpdateZoneCodeParams {
  originZoneCode: string;
  destinZoneCode: string;
  shippingTypeCode?: string;
  mapCode?: string;
  newZoneCode: string;
  updatedBy?: string;
}

export interface RatingZone {
  shipping_type_code?: string;
  rating_zone_code: string;
  rating_zone_name?: string;
  rating_zone_help?: string;
  max_item_weight?: number;
  max_perimeter?: number;
  max_side_dimension?: number;
  standar_cubic?: number;
  [key: string]: unknown;
}

export interface RatingZonesResponse {
  zones: RatingZone[];
  count: number;
}
