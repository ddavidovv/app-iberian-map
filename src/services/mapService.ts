import type { MapData, MapZoneData } from '../types/map';

const CODE_LENGTH_REGEX = /^[A-Z]{2,3}$/;

const ISO3_TO_ISO2: Record<string, string> = {
  AFG: 'AF', AGO: 'AO', AIA: 'AI', ALB: 'AL', AND: 'AD', ARE: 'AE', ARG: 'AR', ARM: 'AM', AUS: 'AU', AUT: 'AT',
  AZE: 'AZ', BEL: 'BE', BGD: 'BD', BGR: 'BG', BHR: 'BH', BHS: 'BS', BIH: 'BA', BLR: 'BY', BLZ: 'BZ', BOL: 'BO',
  BRA: 'BR', BRB: 'BB', BRN: 'BN', BTN: 'BT', BWA: 'BW', CAF: 'CF', CAN: 'CA', CHE: 'CH', CHL: 'CL', CHN: 'CN',
  CIV: 'CI', CMR: 'CM', COD: 'CD', COG: 'CG', COL: 'CO', COM: 'KM', CPV: 'CV', CRI: 'CR', CUB: 'CU', CUW: 'CW',
  CYP: 'CY', CZE: 'CZ', DEU: 'DE', DJI: 'DJ', DMA: 'DM', DNK: 'DK', DOM: 'DO', DZA: 'DZ', ECU: 'EC', EGY: 'EG',
  ERI: 'ER', ESP: 'ES', EST: 'EE', ETH: 'ET', FIN: 'FI', FJI: 'FJ', FRA: 'FR', FSM: 'FM', GAB: 'GA', GBR: 'GB',
  GEO: 'GE', GHA: 'GH', GIB: 'GI', GIN: 'GN', GMB: 'GM', GNB: 'GW', GNQ: 'GQ', GRC: 'GR', GRD: 'GD', GTM: 'GT',
  GUF: 'GF', GUY: 'GY', HND: 'HN', HRV: 'HR', HTI: 'HT', HUN: 'HU', IDN: 'ID', IMN: 'IM', IND: 'IN', IRL: 'IE',
  IRN: 'IR', IRQ: 'IQ', ISL: 'IS', ISR: 'IL', ITA: 'IT', JAM: 'JM', JEY: 'JE', JOR: 'JO', JPN: 'JP', KAZ: 'KZ',
  KEN: 'KE', KGZ: 'KG', KHM: 'KH', KNA: 'KN', KOR: 'KR', KWT: 'KW', LAO: 'LA', LBN: 'LB', LBR: 'LR', LBY: 'LY',
  LCA: 'LC', LIE: 'LI', LKA: 'LK', LSO: 'LS', LTU: 'LT', LUX: 'LU', LVA: 'LV', MAR: 'MA', MCO: 'MC', MDA: 'MD',
  MDG: 'MG', MDV: 'MV', MEX: 'MX', MHL: 'MH', MKD: 'MK', MLI: 'ML', MLT: 'MT', MMR: 'MM', MNE: 'ME', MNG: 'MN',
  MOZ: 'MZ', MRT: 'MR', MUS: 'MU', MWI: 'MW', MYS: 'MY', NAM: 'NA', NCL: 'NC', NER: 'NE', NGA: 'NG', NIC: 'NI',
  NLD: 'NL', NOR: 'NO', NPL: 'NP', NZL: 'NZ', OMN: 'OM', PAK: 'PK', PAN: 'PA', PER: 'PE', PHL: 'PH', PNG: 'PG',
  POL: 'PL', PRI: 'PR', PRK: 'KP', PRT: 'PT', PRY: 'PY', QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', SAU: 'SA',
  SDN: 'SD', SEN: 'SN', SGP: 'SG', SLB: 'SB', SLE: 'SL', SLV: 'SV', SMR: 'SM', SOM: 'SO', SRB: 'RS', SSD: 'SS',
  STP: 'ST', SUR: 'SR', SVK: 'SK', SVN: 'SI', SWE: 'SE', SWZ: 'SZ', SYC: 'SC', SYR: 'SY', TCD: 'TD', TGO: 'TG',
  THA: 'TH', TJK: 'TJ', TKM: 'TM', TLS: 'TL', TON: 'TO', TTO: 'TT', TUN: 'TN', TUR: 'TR', TUV: 'TV', TZA: 'TZ',
  UGA: 'UG', UKR: 'UA', URY: 'UY', USA: 'US', UZB: 'UZ', VAT: 'VA', VEN: 'VE', VNM: 'VN', VUT: 'VU', WSM: 'WS',
  XKX: 'XK', YEM: 'YE', ZAF: 'ZA', ZMB: 'ZM', ZWE: 'ZW', BLM: 'BL', SPM: 'PM', MAF: 'MF', BES: 'BQ', SXM: 'SX',
  ANT: 'AN', SHN: 'SH', WLF: 'WF', REU: 'RE', MYT: 'YT', MTQ: 'MQ', GLP: 'GP', PYF: 'PF',
  ABW: 'AW', ALA: 'AX', GGY: 'GG', HKG: 'HK', MAC: 'MO', PSE: 'PS'
};

const ISO2_OVERRIDES: Record<string, string> = {
  EW: 'EE',
};

const EUROPE_ISO2_CODES = new Set([
  'AD', 'AL', 'AM', 'AT', 'AZ', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK', 'DZ', 'EE', 'ES', 'FI', 'FO',
  'FR', 'GB', 'GE', 'GG', 'GI', 'GR', 'HR', 'HU', 'IE', 'IL', 'IM', 'IS', 'IT', 'JE', 'LI', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SJ', 'SK', 'SM', 'TN',
  'TR', 'UA', 'VA', 'XK', 'GL',
]);

async function fetchSvgContent(svgPath: string = '/assets/iberian_map.svg'): Promise<string> {
  const response = await fetch(svgPath);
  if (!response.ok) {
    throw new Error(`Failed to load SVG map from ${svgPath}`);
  }
  return response.text();
}

function resolveZoneCode(element: Element): string | null {
  let current: Element | null = element;
  while (current) {
    const classAttr = current.getAttribute('class');
    if (classAttr) {
      for (const token of classAttr.split(/\s+/)) {
        const alphaOnly = token.replace(/[^A-Z]/gi, '').toUpperCase();
        if (CODE_LENGTH_REGEX.test(alphaOnly)) {
          return alphaOnly;
        }
      }
    }

    const idAttr = current.getAttribute('id');
    if (idAttr) {
      const alphaOnly = idAttr.replace(/[^A-Z]/gi, '').toUpperCase();
      if (CODE_LENGTH_REGEX.test(alphaOnly)) {
        return alphaOnly;
      }
      if (idAttr.length === 4 && idAttr[0] === 'g') {
        const candidate = idAttr.substring(1).toUpperCase();
        if (CODE_LENGTH_REGEX.test(candidate)) {
          return candidate;
        }
      }
    }

    current = current.parentElement;
  }
  return null;
}

function collectTransforms(element: Element): string | null {
  const transforms: string[] = [];
  let current: Element | null = element;
  while (current) {
    const transform = current.getAttribute('transform');
    if (transform) {
      transforms.unshift(transform);
    }
    current = current.parentElement;
  }
  if (!transforms.length) {
    return null;
  }
  return transforms.join(' ');
}

export function normalizeIsoCode(code: string | null): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();

  if (ISO2_OVERRIDES[upper]) {
    return ISO2_OVERRIDES[upper];
  }

  if (upper.length === 3 && ISO3_TO_ISO2[upper]) {
    return ISO3_TO_ISO2[upper];
  }
  if (upper.length === 3) {
    return upper.slice(0, 2);
  }

  return upper;
}

function computeBoundingBoxes(
  entries: Array<{ element: Element; transform: string | null }>,
  svgNamespace: string,
  originalViewBox: string,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const tempSvg = document.createElementNS(svgNamespace, 'svg');
  tempSvg.setAttribute('viewBox', originalViewBox);
  tempSvg.setAttribute('width', '0');
  tempSvg.setAttribute('height', '0');
  tempSvg.style.position = 'absolute';
  tempSvg.style.opacity = '0';
  tempSvg.style.pointerEvents = 'none';
  document.body.appendChild(tempSvg);

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  try {
    entries.forEach(({ element, transform }) => {
      const tagName = element.tagName.toLowerCase();
      if (!['path', 'rect', 'ellipse', 'polygon', 'polyline'].includes(tagName)) {
        return;
      }

      const clone = element.cloneNode(true) as SVGGraphicsElement;
      if (transform) {
        clone.setAttribute('transform', transform);
      }
      tempSvg.appendChild(clone);
      try {
        const bbox = clone.getBBox();
        if (!Number.isFinite(bbox.x) || !Number.isFinite(bbox.y)) {
          return;
        }
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      } catch {
        // ignore invalid bounding boxes
      } finally {
        tempSvg.removeChild(clone);
      }
    });
  } finally {
    document.body.removeChild(tempSvg);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function parseSvgContent(svgContent: string, sourcePath?: string): MapData {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

  const svg = svgDoc.querySelector('svg');
  let viewBox = svg?.getAttribute('viewBox') || '0 0 800 600';
  const isEuropeMap = Boolean(sourcePath && sourcePath.toLowerCase().includes('europe'));
  const defsNode = svgDoc.querySelector('defs');
  const serializedDefs = defsNode ? defsNode.innerHTML : null;

  const elements = Array.from(svgDoc.querySelectorAll('path, rect, ellipse'));
  const zoneCounters = new Map<string, number>();
  const usedIds = new Set<string>();
  const zoneEntries: Array<{ zone: MapZoneData; element: Element }> = [];

  elements.forEach((element) => {
    const resolvedCode = resolveZoneCode(element);
    const normalizedCode = normalizeIsoCode(resolvedCode);

    if (isEuropeMap && normalizedCode && !EUROPE_ISO2_CODES.has(normalizedCode)) {
      return;
    }

    const tagName = element.tagName.toLowerCase();
    const baseName =
      element.getAttribute('data-name') ||
      element.getAttribute('title') ||
      element.getAttribute('name') ||
      normalizedCode ||
      element.getAttribute('id') ||
      'zone';

    const zoneKey = isEuropeMap
      ? normalizedCode ?? element.getAttribute('id') ?? 'zone'
      : element.getAttribute('id') ?? 'zone';

    const currentCount = zoneCounters.get(zoneKey) ?? 0;
    zoneCounters.set(zoneKey, currentCount + 1);

    const rawId = element.getAttribute('id');
    let domId = rawId && !usedIds.has(rawId) ? rawId : '';
    if (!domId) {
      domId = currentCount === 0 ? zoneKey : `${zoneKey}__${currentCount + 1}`;
    }
    usedIds.add(domId);

    const zone: MapZoneData = {
      id: domId,
      zoneCode: isEuropeMap ? normalizedCode ?? undefined : undefined,
      name: baseName,
      transform: collectTransforms(element),
    };

    if (tagName === 'rect') {
      zone.x = element.getAttribute('x') || '0';
      zone.y = element.getAttribute('y') || '0';
      zone.width = element.getAttribute('width') || '0';
      zone.height = element.getAttribute('height') || '0';
    } else if (tagName === 'ellipse') {
      zone.cx = element.getAttribute('cx') || '0';
      zone.cy = element.getAttribute('cy') || '0';
      zone.rx = element.getAttribute('rx') || '0';
      zone.ry = element.getAttribute('ry') || '0';
    } else {
      zone.d = element.getAttribute('d') || '';
    }

    const hasGeometry =
      (zone.d && zone.d.length > 0) ||
      (zone.x && zone.y && zone.width && zone.height) ||
      (zone.cx && zone.cy && zone.rx && zone.ry);

    if (hasGeometry) {
      zoneEntries.push({ zone, element });
    }
  });

  const zones = zoneEntries.map((entry) => entry.zone);

  return { viewBox, zones, defs: serializedDefs };
}

export async function getMapData(svgPath?: string): Promise<MapData> {
  try {
    const resolvedPath = svgPath ?? '/assets/iberian_map.svg';
    const svgContent = await fetchSvgContent(resolvedPath);
    return parseSvgContent(svgContent, resolvedPath);
  } catch (err) {
    console.error('Error loading map data:', err);
    throw err;
  }
}
