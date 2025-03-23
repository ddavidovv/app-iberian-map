export interface DestinConfig {
  baremo_code: string;
  destin_zones: string[];
}

export interface ZoneConfig {
  origin_zone: string;
  destins: DestinConfig[];
}

export interface BaremoColor {
  code: string;
  name: string;
  color: string;
}

export interface ProductMapConfig {
  id: string;
  name: string;
  mapConfig: ZoneConfig[];
}

export interface MapZoneData {
  id: string;
  d?: string;
  x?: string;
  y?: string;
  cx?: string;
  cy?: string;
  rx?: string;
  ry?: string;
  width?: string;
  height?: string;
  name?: string;
}

export interface MapData {
  viewBox: string;
  zones: MapZoneData[];
}