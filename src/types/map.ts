export type OriginType = 'peninsula' | 'canarias' | 'baleares' | 'islas_portugal';

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

export interface OriginMapConfig {
  origin_type: OriginType;
  mapConfig: ZoneConfig[];
}

export interface ProductMapConfig {
  id: string;
  name: string;
  origins: OriginMapConfig[];
}

export interface MapZoneData {
  id: string;
  zoneCode?: string;
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
  transform?: string | null;
}

export interface MapData {
  viewBox: string;
  zones: MapZoneData[];
  defs?: string | null;
}

export type ZoneStatus = 'ok' | 'warning' | 'svg_only' | 'excel_only';

export interface ZoneMasterEntry {
  zone_code: string;
  zone_name: string;
  country_code: string;
  zone_ccaa: string;
  zone_group: string;
  zone_expreg: string;
  in_svg: boolean;
  svg_id?: string;
  svg_name?: string;
  status: ZoneStatus;
  warning_reason?: string | null;
  excel_equivalent?: string | null;
}

export interface ZonesMaster {
  [zoneId: string]: ZoneMasterEntry;
}
