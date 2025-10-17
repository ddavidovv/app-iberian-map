import type { ServiceOption } from '../context/ShippingMapContext';
import { isInternationalService } from '../context/ShippingMapContext';

export type MapType = 'iberia' | 'world' | 'europe';

export const MAP_SOURCES: Record<MapType, string> = {
  iberia: '/assets/iberian_map.svg',
  world: '/assets/world.svg',
  europe: '/assets/europe-iso.svg',
};

interface MapRule {
  name: string;
  map: MapType;
  match: (service: ServiceOption | null | undefined) => boolean;
}

const EUROPE_CODE_CANDIDATES = new Set(['CIS', 'CIEC', 'CIES', 'CIEU']);
const EUROPE_KEYWORDS = ['internacional economy', 'international economy'];

export const MAP_RULES: MapRule[] = [
  {
    name: 'Internacional Economy',
    map: 'europe',
    match: (service) => {
      if (!service) return false;
      const code = service.code?.toUpperCase() ?? '';
      if (EUROPE_CODE_CANDIDATES.has(code)) {
        return true;
      }
      const name = service.name?.toLowerCase() ?? '';
      return EUROPE_KEYWORDS.some((keyword) => name.includes(keyword));
    },
  },
  {
    name: 'Servicios Internacionales',
    map: 'world',
    match: (service) => {
      if (!service) return false;
      return isInternationalService(service.code);
    },
  },
  {
    name: 'Servicios Ibéricos',
    map: 'iberia',
    match: () => true,
  },
];

export function getMapTypeForService(
  service: ServiceOption | null | undefined,
): { type: MapType; rule: MapRule } {
  const rule = MAP_RULES.find((candidate) => candidate.match(service)) ?? MAP_RULES[MAP_RULES.length - 1];
  return { type: rule.map, rule };
}
