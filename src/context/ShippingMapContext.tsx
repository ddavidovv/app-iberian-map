/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { baremoColors } from '../config/baremos';

type MapMode = 'iberia' | 'world' | 'europe';

export interface ServiceOption {
  code: string;
  name: string;
}

export interface DestinationSummary {
  destin_zone_code?: string | null;
  destin_zone_name?: string | null;
  zone_code?: string | null;
  is_available: boolean;
  source?: string | null;
  alt_shipping_type_codes?: string[];
  shipping_type_name?: string | null;
}

export interface LegendEntry {
  code: string;
  label: string;
  color: string;
  isInternational: boolean;
  isAvailable: boolean;
}

interface ShippingMapContextValue {
  services: ServiceOption[];
  selectedService: ServiceOption | null;
  selectService: (serviceCode: string | null) => void;
  mapMode: MapMode;
  isInternational: boolean;
  originZone: string | null;
  originZoneName: string | null;
  selectOrigin: (zoneId: string | null, zoneName?: string | null) => void;
  destinations: DestinationSummary[];
  destinationMap: Map<string, DestinationSummary>;
  getZoneColor: (zoneId: string) => string;
  getDestinationInfo: (zoneId: string) => DestinationSummary | undefined;
  isSummaryLoading: boolean;
  summaryError: string | null;
  resetSelections: () => void;
  refreshSummary: () => void;
  hasOrigin: boolean;
  pendingWorldView: boolean;
  goToIberia: () => void;
  legendEntries: LegendEntry[];
}

const API_BASE = 'http://localhost:8080/map';
const INTERNATIONAL_PREFIX = 'CI';
const INTERNATIONAL_MAP_PREFIX = 'MAPA_INTER';
const EUROPE_CODES = new Set(['CIE', 'CIS', 'CISE', 'CIEC', 'CIES', 'CIEU']);
export const INTERNATIONAL_CODES = new Set(['CIE', 'CIY', 'CIC', 'CIL', 'CIEX', 'CIES', 'CIEM', 'CIS', 'CISE', 'CIEC', 'CIEU']);

const DEFAULT_ZONE_COLOR = '#e2e8f0';
const ORIGIN_ZONE_COLOR = '#fbbf24';
const NP_COLOR = baremoColors.find((baremo) => baremo.code === 'NP')?.color || '#9ca3af';
const AVAILABLE_FALLBACK_COLOR = '#2563eb';
const INTERNATIONAL_COLOR_PALETTE = [
  '#2563eb',
  '#9333ea',
  '#f97316',
  '#0ea5e9',
  '#ef4444',
  '#22c55e',
  '#facc15',
  '#a855f7',
  '#14b8a6',
  '#f472b6',
  '#38bdf8',
  '#fb7185',
  '#84cc16',
];

const ShippingMapContext = createContext<ShippingMapContextValue | undefined>(undefined);

function normalizeCode(code: string | null | undefined): string | null {
  if (typeof code !== 'string') {
    return null;
  }
  const trimmed = code.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toUpperCase();
}

export function isInternationalService(code: string | null | undefined): boolean {
  if (!code) return false;
  const normalized = code.toUpperCase();
  return (
    INTERNATIONAL_CODES.has(normalized) ||
    normalized.startsWith(INTERNATIONAL_PREFIX) ||
    normalized.startsWith(INTERNATIONAL_MAP_PREFIX)
  );
}

function isEuropeService(code: string | null | undefined): boolean {
  if (!code) {
    return false;
  }
  return EUROPE_CODES.has(code.toUpperCase());
}

function getBaremoLabel(code: string | null | undefined): string {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return 'No permitido';
  }
  if (normalized === 'NP') {
    return 'No permitido';
  }
  const baremo = baremoColors.find((item) => item.code === normalized);
  if (baremo) {
    return baremo.name;
  }
  const singleLetterMatch = normalized.match(/^ZI([A-Z])$/);
  if (singleLetterMatch) {
    return `Zona ${singleLetterMatch[1]}`;
  }
  if (/^Z[A-Z]{2}$/.test(normalized)) {
    return `Zona ${normalized.slice(1)}`;
  }
  if (normalized.startsWith('Z')) {
    return `Zona ${normalized.substring(1)}`;
  }
  return `Baremo ${normalized}`;
}

export function ShippingMapProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('iberia');
  const [originZone, setOriginZone] = useState<string | null>(null);
  const [originZoneName, setOriginZoneName] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<DestinationSummary[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [pendingWorldView, setPendingWorldView] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch(`${API_BASE}/filters`);
        if (!response.ok) {
          throw new Error(`Error fetching services (${response.status})`);
        }
        const payload = await response.json();
        const apiServices = Array.isArray(payload?.services) ? payload.services : [];
        setServices(apiServices);
      } catch (error) {
        console.error('Error loading services list:', error);
      }
    }

    loadServices();
  }, []);

  const selectService = useCallback((serviceCode: string | null) => {
    const normalized = normalizeCode(serviceCode);
    setSelectedServiceCode(normalized);
    setDestinations([]);
    setSummaryError(null);

    const europeSelected = isEuropeService(normalized);

    if (europeSelected) {
      if (originZone) {
        setMapMode('europe');
        setPendingWorldView(false);
      } else {
        setMapMode('iberia');
        setPendingWorldView(true);
      }
      return;
    }

    if (isInternationalService(normalized)) {
      if (originZone) {
        setMapMode('world');
        setPendingWorldView(false);
      } else {
        setMapMode('iberia');
        setPendingWorldView(true);
      }
    } else {
      setMapMode('iberia');
      setPendingWorldView(false);
    }
  }, [originZone]);

  const selectedService = useMemo(() => {
    if (!selectedServiceCode) return null;
    return services.find((service) => service.code.toUpperCase() === selectedServiceCode) ?? null;
  }, [selectedServiceCode, services]);

  const isInternational = useMemo(
    () => isInternationalService(selectedServiceCode),
    [selectedServiceCode],
  );

  const destinationsMap = useMemo(() => {
    const map = new Map<string, DestinationSummary>();
    destinations.forEach((destination) => {
      const key = normalizeCode(destination.destin_zone_code);
      if (key) {
        map.set(key, destination);
      }
    });
    return map;
  }, [destinations]);

  const internationalZoneColors = useMemo(() => {
    const assignments = new Map<string, string>();
    let paletteIndex = 0;

    destinations.forEach((destination) => {
      const zoneCode = normalizeCode(destination.zone_code);
      if (!zoneCode || zoneCode === 'NP') {
        return;
      }

      const alreadyKnown =
        baremoColors.some((baremo) => baremo.code === zoneCode) || assignments.has(zoneCode);
      if (alreadyKnown) {
        return;
      }

      const color = INTERNATIONAL_COLOR_PALETTE[paletteIndex % INTERNATIONAL_COLOR_PALETTE.length];
      assignments.set(zoneCode, color);
      paletteIndex += 1;
    });

    return assignments;
  }, [destinations]);

  const resolveBaremoColor = useCallback(
    (zoneCode: string | null | undefined, isAvailable: boolean) => {
      const normalizedZoneCode = normalizeCode(zoneCode);

      if (!normalizedZoneCode) {
        return isAvailable ? AVAILABLE_FALLBACK_COLOR : NP_COLOR;
      }

      if (normalizedZoneCode === 'NP') {
        return NP_COLOR;
      }

      const baremo = baremoColors.find((item) => item.code === normalizedZoneCode);
      if (baremo?.color) {
        return baremo.color;
      }

      const internationalColor = internationalZoneColors.get(normalizedZoneCode);
      if (internationalColor) {
        return internationalColor;
      }

      return isAvailable ? AVAILABLE_FALLBACK_COLOR : NP_COLOR;
    },
    [internationalZoneColors],
  );

  const legendEntries = useMemo(() => {
    const codeStats = new Map<string, { isAvailable: boolean }>();

    destinations.forEach((destination) => {
      const normalizedZoneCode = normalizeCode(destination.zone_code);
      const isAvailable = Boolean(destination.is_available);

      if (!normalizedZoneCode) {
        const current = codeStats.get('NP') ?? { isAvailable: false };
        codeStats.set('NP', { isAvailable: current.isAvailable || isAvailable });
        return;
      }

      const current = codeStats.get(normalizedZoneCode) ?? { isAvailable: false };
      codeStats.set(normalizedZoneCode, { isAvailable: current.isAvailable || isAvailable });
    });

    const entries: LegendEntry[] = [];

    codeStats.forEach(({ isAvailable }, code) => {
      const label = getBaremoLabel(code);
      const color = resolveBaremoColor(code, isAvailable);
      const isInternational = !baremoColors.some((baremo) => baremo.code === code) && code !== 'NP';

      entries.push({
        code,
        label,
        color,
        isInternational,
        isAvailable,
      });
    });

    entries.sort((a, b) => {
      if (a.code === 'NP') return 1;
      if (b.code === 'NP') return -1;
      if (a.isInternational && !b.isInternational) return 1;
      if (!a.isInternational && b.isInternational) return -1;
      return a.label.localeCompare(b.label, 'es');
    });

    return entries;
  }, [destinations, resolveBaremoColor]);

  const selectOrigin = useCallback(
    (zoneId: string | null, zoneName?: string | null) => {
      const normalizedZoneId = normalizeCode(zoneId);
      setOriginZone(normalizedZoneId);
      if (zoneName !== undefined) {
        setOriginZoneName(zoneName);
      }

      if (!normalizedZoneId) {
        setOriginZoneName(null);
        setDestinations([]);
        setSummaryError(null);
        setIsSummaryLoading(false);
        setMapMode('iberia');
        setPendingWorldView(
          selectedServiceCode ? isInternationalService(selectedServiceCode) : false,
        );
        return;
      }

      if (selectedServiceCode && isEuropeService(selectedServiceCode)) {
        setMapMode('europe');
        setPendingWorldView(false);
      } else if (selectedServiceCode && isInternationalService(selectedServiceCode)) {
        setMapMode('world');
        setPendingWorldView(false);
      } else {
        setMapMode('iberia');
      }
    },
    [selectedServiceCode],
  );

  useEffect(() => {
    if (!originZone || !selectedServiceCode) {
      abortControllerRef.current?.abort();
      setDestinations([]);
      setSummaryError(null);
      setIsSummaryLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = controller;

    async function loadSummary() {
      try {
        setIsSummaryLoading(true);
        setSummaryError(null);
        const params = new URLSearchParams({
          origin_zone_code: originZone,
          shipping_type_code: selectedServiceCode,
        });
        const response = await fetch(`${API_BASE}/origin-summary?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = typeof payload?.error === 'string' ? payload.error : response.statusText;
          throw new Error(message || 'Error fetching origin summary');
        }

        const payload = await response.json();

        if (payload?.origin) {
          const normalizedOriginCode = normalizeCode(payload.origin.origin_zone_code);
          if (normalizedOriginCode && normalizedOriginCode !== originZone) {
            setOriginZone(normalizedOriginCode);
          }
          setOriginZoneName(payload.origin.origin_zone_name ?? originZoneName);
        }

        const summary = Array.isArray(payload?.destinations)
          ? payload.destinations.map((destination) => {
              const normalizedDestin = normalizeCode(destination?.destin_zone_code);
              const normalizedBaremo =
                normalizeCode(destination?.zone_code) ?? destination?.zone_code ?? null;
              return {
                ...destination,
                destin_zone_code: normalizedDestin,
                zone_code: normalizedBaremo,
              } as DestinationSummary;
            })
          : [];
        setDestinations(summary);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        console.error('Error loading origin summary:', error);
        setSummaryError(error instanceof Error ? error.message : 'Error desconocido');
        setDestinations([]);
      } finally {
        setIsSummaryLoading(false);
      }
    }

    loadSummary();

    return () => {
      controller.abort();
    };
  }, [originZone, selectedServiceCode, originZoneName, refreshTrigger]);

  const getDestinationInfo = useCallback(
    (zoneId: string) => {
      const normalizedZoneId = normalizeCode(zoneId);
      if (!normalizedZoneId) {
        return undefined;
      }
      return destinationsMap.get(normalizedZoneId);
    },
    [destinationsMap],
  );

  const getZoneColor = useCallback(
    (zoneId: string) => {
      if (!selectedServiceCode || !originZone) {
        return DEFAULT_ZONE_COLOR;
      }

      const normalizedZoneId = normalizeCode(zoneId);
      if (normalizedZoneId && normalizedZoneId === originZone) {
        return ORIGIN_ZONE_COLOR;
      }

      if (!normalizedZoneId) {
        return DEFAULT_ZONE_COLOR;
      }

      const info = destinationsMap.get(normalizedZoneId);
      if (!info) {
        return DEFAULT_ZONE_COLOR;
      }

      return resolveBaremoColor(info.zone_code, info.is_available);
    },
    [selectedServiceCode, originZone, destinationsMap, resolveBaremoColor],
  );

  const resetSelections = useCallback(() => {
    setSelectedServiceCode(null);
    setMapMode('iberia');
    setOriginZone(null);
    setOriginZoneName(null);
    setDestinations([]);
    setSummaryError(null);
    setPendingWorldView(false);
  }, []);

  const refreshSummary = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const goToIberia = useCallback(() => {
    setMapMode('iberia');
    setPendingWorldView(false);
  }, []);

  const value: ShippingMapContextValue = {
    services,
    selectedService,
    selectService,
    mapMode,
    isInternational,
    originZone,
    originZoneName,
    selectOrigin,
    destinations,
    destinationMap: destinationsMap,
    getZoneColor,
    getDestinationInfo,
    isSummaryLoading,
    summaryError,
    resetSelections,
    refreshSummary,
    hasOrigin: Boolean(originZone),
    pendingWorldView,
    goToIberia,
    legendEntries,
  };

  return (
    <ShippingMapContext.Provider value={value}>{children}</ShippingMapContext.Provider>
  );
}

export function useShippingMap(): ShippingMapContextValue {
  const context = useContext(ShippingMapContext);
  if (!context) {
    throw new Error('useShippingMap must be used within a ShippingMapProvider');
  }
  return context;
}
