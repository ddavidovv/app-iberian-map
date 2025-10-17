import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe2, Maximize2, Minimize2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useMapData } from '../hooks/useMapData';
import type { MapZoneData } from '../types/map';
import type { ApiZone } from '../types/zones';
import { ServiceSelector } from '../components/ServiceSelector';
import { normalizeIsoCode } from '../services/mapService';
import { MAP_SOURCES, getMapTypeForService } from '../config/mapSources';
import { DraggableLegend } from '../components/DraggableLegend';
import { useShippingMap } from '../context/ShippingMapContext';
import type { DestinationSummary } from '../context/ShippingMapContext';

const ZONES_API_URL = 'http://localhost:8080/map/zones';

// Mapa de códigos ISO2 a nombres de países en español
const COUNTRY_NAMES: Record<string, string> = {
  AD: 'Andorra', AE: 'Emiratos Árabes Unidos', AF: 'Afganistán', AG: 'Antigua y Barbuda',
  AI: 'Anguila', AL: 'Albania', AM: 'Armenia', AO: 'Angola', AR: 'Argentina', AT: 'Austria',
  AU: 'Australia', AW: 'Aruba', AZ: 'Azerbaiyán', BA: 'Bosnia y Herzegovina', BB: 'Barbados',
  BD: 'Bangladés', BE: 'Bélgica', BF: 'Burkina Faso', BG: 'Bulgaria', BH: 'Baréin', BI: 'Burundi',
  BJ: 'Benín', BL: 'San Bartolomé', BM: 'Bermudas', BN: 'Brunéi', BO: 'Bolivia',
  BQ: 'Bonaire', BR: 'Brasil', BS: 'Bahamas', BT: 'Bután', BW: 'Botsuana', BY: 'Bielorrusia',
  BZ: 'Belice', CA: 'Canadá', CD: 'Rep. Dem. del Congo', CF: 'República Centroafricana',
  CG: 'Congo', CH: 'Suiza', CI: 'Costa de Marfil', CL: 'Chile', CM: 'Camerún', CN: 'China',
  CO: 'Colombia', CR: 'Costa Rica', CU: 'Cuba', CV: 'Cabo Verde', CW: 'Curazao', CY: 'Chipre',
  CZ: 'República Checa', DE: 'Alemania', DJ: 'Yibuti', DK: 'Dinamarca', DM: 'Dominica',
  DO: 'República Dominicana', DZ: 'Argelia', EC: 'Ecuador', EE: 'Estonia', EG: 'Egipto',
  ER: 'Eritrea', ES: 'España', ET: 'Etiopía', FI: 'Finlandia', FJ: 'Fiyi', FM: 'Micronesia',
  FO: 'Islas Feroe', FR: 'Francia', GA: 'Gabón', GB: 'Reino Unido', GD: 'Granada', GE: 'Georgia',
  GF: 'Guayana Francesa', GG: 'Guernsey', GH: 'Ghana', GI: 'Gibraltar', GL: 'Groenlandia',
  GM: 'Gambia', GN: 'Guinea', GP: 'Guadalupe', GQ: 'Guinea Ecuatorial', GR: 'Grecia',
  GT: 'Guatemala', GU: 'Guam', GW: 'Guinea-Bisáu', GY: 'Guyana', HK: 'Hong Kong', HN: 'Honduras',
  HR: 'Croacia', HT: 'Haití', HU: 'Hungría', ID: 'Indonesia', IE: 'Irlanda', IL: 'Israel',
  IM: 'Isla de Man', IN: 'India', IQ: 'Irak', IR: 'Irán', IS: 'Islandia', IT: 'Italia',
  JE: 'Jersey', JM: 'Jamaica', JO: 'Jordania', JP: 'Japón', KE: 'Kenia', KG: 'Kirguistán',
  KH: 'Camboya', KM: 'Comoras', KN: 'San Cristóbal y Nieves', KP: 'Corea del Norte',
  KR: 'Corea del Sur', KW: 'Kuwait', KY: 'Islas Caimán', KZ: 'Kazajistán', LA: 'Laos',
  LB: 'Líbano', LC: 'Santa Lucía', LI: 'Liechtenstein', LK: 'Sri Lanka', LR: 'Liberia',
  LS: 'Lesoto', LT: 'Lituania', LU: 'Luxemburgo', LV: 'Letonia', LY: 'Libia', MA: 'Marruecos',
  MC: 'Mónaco', MD: 'Moldavia', ME: 'Montenegro', MF: 'San Martín', MG: 'Madagascar',
  MH: 'Islas Marshall', MK: 'Macedonia del Norte', ML: 'Malí', MM: 'Birmania', MN: 'Mongolia',
  MO: 'Macao', MQ: 'Martinica', MR: 'Mauritania', MS: 'Montserrat', MT: 'Malta', MU: 'Mauricio',
  MV: 'Maldivas', MW: 'Malaui', MX: 'México', MY: 'Malasia', MZ: 'Mozambique', NA: 'Namibia',
  NC: 'Nueva Caledonia', NE: 'Níger', NG: 'Nigeria', NI: 'Nicaragua', NL: 'Países Bajos',
  NO: 'Noruega', NP: 'Nepal', NZ: 'Nueva Zelanda', OM: 'Omán', PA: 'Panamá', PE: 'Perú',
  PF: 'Polinesia Francesa', PG: 'Papúa Nueva Guinea', PH: 'Filipinas', PK: 'Pakistán',
  PL: 'Polonia', PM: 'San Pedro y Miquelón', PR: 'Puerto Rico', PS: 'Palestina', PT: 'Portugal',
  PY: 'Paraguay', QA: 'Catar', RE: 'Reunión', RO: 'Rumanía', RS: 'Serbia', RU: 'Rusia',
  RW: 'Ruanda', SA: 'Arabia Saudita', SB: 'Islas Salomón', SC: 'Seychelles', SD: 'Sudán',
  SE: 'Suecia', SG: 'Singapur', SH: 'Santa Elena', SI: 'Eslovenia', SJ: 'Svalbard y Jan Mayen',
  SK: 'Eslovaquia', SL: 'Sierra Leona', SM: 'San Marino', SN: 'Senegal', SO: 'Somalia',
  SR: 'Surinam', SS: 'Sudán del Sur', ST: 'Santo Tomé y Príncipe', SV: 'El Salvador',
  SX: 'Sint Maarten', SY: 'Siria', SZ: 'Esuatini', TC: 'Islas Turcas y Caicos', TD: 'Chad',
  TG: 'Togo', TH: 'Tailandia', TJ: 'Tayikistán', TL: 'Timor Oriental', TM: 'Turkmenistán',
  TN: 'Túnez', TO: 'Tonga', TR: 'Turquía', TT: 'Trinidad y Tobago', TV: 'Tuvalu', TW: 'Taiwán',
  TZ: 'Tanzania', UA: 'Ucrania', UG: 'Uganda', US: 'Estados Unidos', UY: 'Uruguay',
  UZ: 'Uzbekistán', VA: 'Ciudad del Vaticano', VC: 'San Vicente y las Granadinas',
  VE: 'Venezuela', VG: 'Islas Vírgenes Británicas', VI: 'Islas Vírgenes de EE.UU.',
  VN: 'Vietnam', VU: 'Vanuatu', WF: 'Wallis y Futuna', WS: 'Samoa', XK: 'Kosovo', YE: 'Yemen',
  YT: 'Mayotte', ZA: 'Sudáfrica', ZM: 'Zambia', ZW: 'Zimbabue'
};

interface CountrySummary {
  countryCode: string;
  displayName: string;
  zones: ApiZone[];
  hasDetailedZones: boolean;
}

function buildZoneElement(
  zone: MapZoneData,
  options: {
    onSelect: (id: string) => void;
    isSelected: boolean;
    hasData: boolean;
    fill: string;
    hoverFill: string;
    reactKey?: string;
    displayName?: string;
    baremoInfo?: string;
  },
): React.ReactNode {
  const { onSelect, isSelected, hasData, fill, hoverFill, reactKey, displayName, baremoInfo } = options;
  const zoneKey = zone.zoneCode ?? zone.id;
  const baseStroke = isSelected ? '#0f172a' : '#cbd5f5';
  const className = hasData
    ? 'transition-colors duration-200 cursor-pointer'
    : 'cursor-default opacity-80';
  const elementKey = reactKey ?? `${zoneKey}-${zone.id}`;

  const commonProps = {
    id: zone.id,
    stroke: baseStroke,
    strokeWidth: isSelected ? 1.5 : 0.6,
    fill,
    className,
    onClick: () => onSelect(zoneKey),
  } as const;

  if (zone.d) {
    return (
      <path
        key={elementKey}
        {...commonProps}
        d={zone.d}
        onMouseEnter={(event) => {
          if (hasData || !isSelected) {
            event.currentTarget.setAttribute('fill', hoverFill);
          }
        }}
        onMouseLeave={(event) => {
          event.currentTarget.setAttribute('fill', fill);
        }}
      >
        <title>{displayName || zone.name || zone.id}{baremoInfo ? ` - ${baremoInfo}` : ''}</title>
      </path>
    );
  }

  if (zone.width && zone.height && zone.x && zone.y) {
    return (
      <rect
        key={elementKey}
        {...commonProps}
        x={zone.x}
        y={zone.y}
        width={zone.width}
        height={zone.height}
        onMouseEnter={(event) => {
          if (hasData || !isSelected) {
            event.currentTarget.setAttribute('fill', hoverFill);
          }
        }}
        onMouseLeave={(event) => {
          event.currentTarget.setAttribute('fill', fill);
        }}
      >
        <title>{displayName || zone.name || zone.id}{baremoInfo ? ` - ${baremoInfo}` : ''}</title>
      </rect>
    );
  }

  if (zone.cx && zone.cy && zone.rx && zone.ry) {
    return (
      <ellipse
        key={elementKey}
        {...commonProps}
        cx={zone.cx}
        cy={zone.cy}
        rx={zone.rx}
        ry={zone.ry}
        onMouseEnter={(event) => {
          if (hasData || !isSelected) {
            event.currentTarget.setAttribute('fill', hoverFill);
          }
        }}
        onMouseLeave={(event) => {
          event.currentTarget.setAttribute('fill', fill);
        }}
      >
        <title>{displayName || zone.name || zone.id}{baremoInfo ? ` - ${baremoInfo}` : ''}</title>
      </ellipse>
    );
  }

  return null;
}

type WorldMapVariant = 'full' | 'embedded';

interface WorldMapScreenProps {
  variant?: WorldMapVariant;
  className?: string;
  showServiceSelector?: boolean;
}

function normalizeCountryId(code: string | null | undefined): string | null {
  const candidate = code == null ? null : String(code).trim();
  const normalized = normalizeIsoCode(candidate);
  if (normalized) {
    return normalized.toUpperCase();
  }
  return candidate && candidate.length > 0 ? candidate.toUpperCase() : null;
}

export function WorldMapScreen({
  variant = 'full',
  className,
  showServiceSelector,
}: WorldMapScreenProps): JSX.Element {
  const {
    services,
    selectedService,
    selectService,
    originZone,
    originZoneName,
    destinations,
    getZoneColor,
    isSummaryLoading,
    summaryError,
    goToIberia,
    legendEntries,
  } = useShippingMap();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedDestinationCode, setSelectedDestinationCode] = useState<string | null>(null);

  const serviceForMap = selectedService ?? null;
  const { type: mapType } = useMemo(
    () => getMapTypeForService(serviceForMap),
    [serviceForMap],
  );
  const mapSvgPath = MAP_SOURCES[mapType];

  const { mapData, isLoading: mapLoading, error: mapError } = useMapData(mapSvgPath);
  const [zones, setZones] = useState<ApiZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const clearDestinationSelection = () => {
    setSelectedDestinationCode(null);
    setSelectedCountry(null);
  };
  const togglePanelCollapsed = () => setIsPanelCollapsed((prev) => !prev);

  useEffect(() => {
    const target = mapContainerRef.current;
    if (!target) return;

    const handleFullscreenChange = () => {
      const isActive =
        document.fullscreenElement === target ||
        target.contains(document.fullscreenElement as Node | null);
      setIsFullscreen(isActive);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const target = mapContainerRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      void target.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen();
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadZones() {
      try {
        setZonesLoading(true);
        setZonesError(null);
        const response = await fetch(ZONES_API_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }
        const payload = (await response.json()) as { zones: ApiZone[] };
        setZones(Array.isArray(payload.zones) ? payload.zones : []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setZonesError(error instanceof Error ? error.message : 'Error cargando datos de zonas');
        }
      } finally {
        setZonesLoading(false);
      }
    }

    loadZones();

    return () => controller.abort();
  }, []);

  const zoneNames = useMemo(() => {
    if (!mapData) return new Map<string, string>();
    return new Map(mapData.zones.map((zone) => [zone.id, zone.name ?? zone.id]));
  }, [mapData]);

  const countries = useMemo(() => {
    const summary = new Map<string, CountrySummary>();

    zones.forEach((zone) => {
      if (!zone.country_code) {
        return;
      }

      const key = zone.country_code;
      const current = summary.get(key);
      const zoneEntry = {
        ...zone,
        zone_name: zone.zone_name || zone.zone_code,
      };

      if (current) {
        current.zones.push(zoneEntry);
        if (zone.zone_code && zone.zone_code !== key) {
          current.hasDetailedZones = true;
        }
      } else {
        summary.set(key, {
          countryCode: key,
          displayName: zoneNames.get(key) || zone.zone_name || key,
          zones: [zoneEntry],
          hasDetailedZones: zone.zone_code ? zone.zone_code !== key : false,
        });
      }
    });

    return summary;
  }, [zones, zoneNames]);

  const countryDestinations = useMemo(() => {
    const map = new Map<string, DestinationSummary[]>();
    destinations.forEach((destination) => {
      const normalizedDestCode = normalizeCountryId(destination.destin_zone_code);
      if (!normalizedDestCode) {
        return;
      }
      const country = extractCountryCode(normalizedDestCode);
      if (!country) {
        return;
      }
      const list = map.get(country);
      if (list) {
        list.push({ ...destination, destin_zone_code: normalizedDestCode });
      } else {
        map.set(country, [{ ...destination, destin_zone_code: normalizedDestCode }]);
      }
    });
    return map;
  }, [destinations]);

  const selectedSummary = selectedCountry ? countries.get(selectedCountry) : undefined;
  const selectedName = originZone
    ? originZoneName || zoneNames.get(originZone) || originZone
    : null;

  const handleCountrySelect = (countryId: string) => {
    const normalized = normalizeCountryId(countryId);
    setSelectedCountry(normalized);
    const entries = normalized ? countryDestinations.get(normalized) : undefined;
    if (entries?.length) {
      const prioritized = pickPreferredDestination(entries);
      const normalizedDestinationCode = normalizeCountryId(prioritized?.destin_zone_code);
      setSelectedDestinationCode(normalizedDestinationCode);
    } else {
      setSelectedDestinationCode(null);
    }
  };

  const getCountryFill = (countryId: string) => {
    const normalized = normalizeCountryId(countryId);
    if (!normalized) {
      return getZoneColor(countryId);
    }

    if (!selectedService || !originZone) {
      return getZoneColor(normalized);
    }

    const entries = countryDestinations.get(normalized);
    if (!entries?.length) {
      return getZoneColor(normalized);
    }

    const prioritized = pickPreferredDestination(entries);
    if (prioritized?.destin_zone_code) {
      return getZoneColor(prioritized.destin_zone_code);
    }

    return getZoneColor(normalized);
  };

  const getHoverFill = (countryId: string) => {
    return getCountryFill(countryId);
  };

  const selectedDestination = useMemo(() => {
    const normalized = normalizeCountryId(selectedDestinationCode);
    if (!normalized) return undefined;
    return destinations.find(
      (destination) => normalizeCountryId(destination.destin_zone_code) === normalized,
    );
  }, [selectedDestinationCode, destinations]);

  useEffect(() => {
    const normalizedSelected = normalizeCountryId(selectedDestinationCode);
    const currentExists = normalizedSelected
      ? destinations.some(
          (destination) =>
            normalizeCountryId(destination.destin_zone_code) === normalizedSelected,
        )
      : false;

    if (!destinations.length) {
      setSelectedDestinationCode(null);
      setSelectedCountry(null);
      return;
    }

    if (currentExists) {
      setSelectedCountry(
        extractCountryCode(selectedDestinationCode) ?? selectedCountry ?? null,
      );
      return;
    }

    const fallback =
      destinations.find(
        (destination) => destination.destin_zone_code && destination.zone_code && destination.zone_code !== 'NP',
      ) ?? destinations[0];

    const normalizedFallbackCode = normalizeCountryId(fallback?.destin_zone_code);
    setSelectedDestinationCode(normalizedFallbackCode);
    setSelectedCountry(extractCountryCode(normalizedFallbackCode) ?? null);
  }, [destinations, selectedDestinationCode, selectedCountry]);

  const wantsServiceSelector = showServiceSelector ?? variant === 'full';
  const showInlineServiceSelector = wantsServiceSelector && variant !== 'full';
  const outerClass = [
    variant === 'full' ? 'flex flex-col gap-6 w-full' : 'flex flex-col gap-5',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const contentWrapperClass = variant === 'full' ? 'flex flex-col gap-6' : 'flex flex-col gap-5';
  const mapCardClass =
    variant === 'embedded'
      ? 'rounded-lg border border-slate-200 p-4 bg-white shadow-sm'
      : 'bg-white rounded-lg shadow-lg p-4';
  const asideCardClass =
    variant === 'embedded'
      ? 'rounded-lg border border-slate-200 p-5 h-fit bg-white'
      : 'bg-white rounded-lg shadow-lg p-5 h-fit border border-slate-200';
  const baseHeightClass = variant === 'embedded' ? 'h-[620px]' : 'h-[720px]';
  const mapHeightClass = isFullscreen ? 'h-screen' : baseHeightClass;
  const showEmbeddedIntro = variant === 'embedded' && showInlineServiceSelector;
  const sidePanel =
    !wantsServiceSelector || variant !== 'full'
      ? null
      : (
          <div
            className={`relative shrink-0 transition-all duration-300 ease-in-out ${
              isPanelCollapsed ? 'w-[68px]' : 'w-[320px]'
            }`}
          >
            <button
              type="button"
              onClick={togglePanelCollapsed}
              className="absolute -right-3 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50"
              aria-label={isPanelCollapsed ? 'Expandir panel de servicios' : 'Contraer panel de servicios'}
            >
              {isPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <div className="sticky top-24">
              {isPanelCollapsed ? (
                <div className="flex h-[520px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 text-[11px] uppercase tracking-[0.3em] text-slate-400 shadow-xl">
                  <span className="rounded-full bg-red-50 p-3 text-red-600">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span className="-rotate-90 whitespace-nowrap">Servicios</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <ServiceSelector
                    services={services}
                    selectedCode={selectedService?.code ?? null}
                    onSelect={selectService}
                    className="w-full"
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow">
                    {selectedService ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs uppercase text-slate-400 tracking-[0.2em]">
                          <span>Servicio activo</span>
                          <span>Origen</span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{selectedService.code}</p>
                            <p className="text-xs text-slate-500 leading-snug">{selectedService.name}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {originZone ? originZoneName || originZone : 'Sin origen seleccionado'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Destinos configurados</span>
                          <span className="font-semibold text-slate-800">{destinations.length}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-snug">
                        Selecciona un servicio para visualizar los destinos disponibles en este mapa.
                      </p>
                    )}
                  </div>

                  {selectedDestination && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow">
                      <div className="flex items-center justify-between text-xs uppercase text-slate-400 tracking-[0.2em]">
                        <span>Destino seleccionado</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            selectedDestination.is_available
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {selectedDestination.is_available ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        {selectedDestination.destin_zone_code}
                        {selectedDestination.destin_zone_name
                          ? ` · ${selectedDestination.destin_zone_name}`
                          : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        Baremo asignado: {selectedDestination.zone_code ?? 'NP'}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => selectService(null)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Limpiar servicio
                    </button>
                    <button
                      type="button"
                      onClick={clearDestinationSelection}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Limpiar destino
                    </button>
                  </div>

                  {zonesError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 shadow">
                      {zonesError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

  const renderWithLayout = (content: React.ReactNode) => {
    if (variant === 'full') {
      return (
        <div className="min-h-screen bg-gray-100">
          <div className="flex min-h-screen gap-6 px-6 py-8">
            {sidePanel}
            <div className="flex-1 overflow-y-auto">
              <div className={outerClass}>{content}</div>
            </div>
          </div>
        </div>
      );
    }
    return <div className={outerClass}>{content}</div>;
  };

  if (mapLoading || zonesLoading) {
    const loadingInner =
      variant === 'full'
        ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-gray-600">Cargando mapa mundial...</div>
            </div>
          )
        : (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700" />
              Cargando mapa mundial...
            </div>
          );

    return renderWithLayout(<div className={contentWrapperClass}>{loadingInner}</div>);
  }

  if (mapError || zonesError || !mapData) {
    const errorMessage = mapError?.message || zonesError || 'Intenta recargar la pagina o revisa tu conexión.';

    if (variant === 'full') {
      const fullError = (
        <div className="min-h-[60vh] flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow px-6 py-10">
          <Globe2 className="w-12 h-12 text-gray-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">No se pudo cargar el mapa</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Link
            to="/"
            onClick={() => goToIberia()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al mapa ibérico
          </Link>
        </div>
      );
      return renderWithLayout(<div className={contentWrapperClass}>{fullError}</div>);
    }

    const compactError = (
      <div className="flex items-center gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        <Globe2 className="w-4 h-4" />
        <span>No se pudo cargar el mapa mundial. Intenta abrir la vista completa o recargar.</span>
      </div>
    );

    return renderWithLayout(<div className={contentWrapperClass}>{compactError}</div>);
  }

  const mapTitle =
    mapType === 'europe'
      ? 'Mapa europeo de zonas'
      : mapType === 'world'
      ? 'Mapa mundial de zonas'
      : 'Mapa de zonas';
  const mapSubtitle =
    mapType === 'europe'
      ? 'Selecciona un país para ver las zonas configuradas en Europa.'
      : mapType === 'world'
      ? 'Selecciona un país para ver las zonas configuradas en MongoDB.'
      : 'Selecciona una provincia para consultar sus destinos disponibles.';

  const content = (
    <>
      {variant === 'full' && (
        <header className="bg-slate-900 text-white py-4">
          <div className="container mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe2 className="w-7 h-7" />
              <div>
                <h1 className="text-xl font-semibold">{mapTitle}</h1>
                <p className="text-sm text-slate-200">{mapSubtitle}</p>
              </div>
            </div>
            <Link
              to="/"
              onClick={() => goToIberia()}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al mapa ibérico
            </Link>
          </div>
        </header>
      )}

      <div className={contentWrapperClass}>
        {showEmbeddedIntro && (
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-800">Destinos internacionales</h2>
            <p className="text-sm text-slate-600">
              Consulta los baremos de países sin salir del mapa ibérico.
            </p>
          </div>
        )}

        {showInlineServiceSelector && (
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-4">
            <div className="w-full max-w-[320px]">
              <ServiceSelector
                services={services}
                selectedCode={selectedService?.code ?? null}
                onSelect={selectService}
                className="w-full"
              />
            </div>
            <div className="flex-1 text-sm text-slate-600">
              {selectedService ? (
                <p>
                  Servicio seleccionado:{' '}
                  <span className="font-semibold text-slate-800">{selectedService.code}</span> -{' '}
                  {selectedService.name}. Haz clic en un país para ver su baremo como destino.
                </p>
              ) : (
                <p>Selecciona un servicio para visualizar los baremos por país.</p>
              )}
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${variant === 'embedded' ? 'grid-cols-1' : 'lg:grid-cols-[minmax(0,1.6fr)_340px]'}`}>
          <div className={mapCardClass}>
            <div
              ref={mapContainerRef}
              className="relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50"
            >
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 bg-white/95 rounded-full shadow border border-slate-200 hover:bg-slate-100 transition-colors"
                  title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
              <svg
                viewBox={mapData.viewBox}
                className={`w-full ${mapHeightClass}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {mapData.defs ? <defs dangerouslySetInnerHTML={{ __html: mapData.defs }} /> : null}
                <g>
                  {mapData.zones.map((zone, index) => {
                    const zoneKey = zone.zoneCode ?? zone.id;
                    const normalizedZoneId = normalizeCountryId(zoneKey);
                    const hasData = normalizedZoneId
                      ? countryDestinations.has(normalizedZoneId)
                      : false;
                    const reactKey = `${zoneKey}-${zone.id}-${index}`;
                    // Prioridad: 1) diccionario de países si zone.name es un código ISO, 2) nombre del SVG, 3) zoneNames map
                    // Si zone.name es igual al código (ej: "PL"), usar el diccionario en lugar del código
                    const isNameJustCode = zone.name && zone.name.toUpperCase() === normalizedZoneId;
                    const displayName = (isNameJustCode && normalizedZoneId ? COUNTRY_NAMES[normalizedZoneId] : zone.name) ||
                      (normalizedZoneId ? COUNTRY_NAMES[normalizedZoneId] : undefined) ||
                      (normalizedZoneId ? zoneNames.get(normalizedZoneId) : undefined);

                    // Obtener información del baremo para este país
                    let baremoInfo = '';
                    if (selectedService && originZone && normalizedZoneId) {
                      const entries = countryDestinations.get(normalizedZoneId);
                      if (entries?.length) {
                        const prioritized = pickPreferredDestination(entries);
                        if (prioritized) {
                          const baremoCode = prioritized.zone_code || 'NP';
                          const zoneName = prioritized.destin_zone_name;
                          baremoInfo = zoneName ? `${zoneName} (${baremoCode})` : `Baremo: ${baremoCode}`;
                        }
                      }
                    }

                    return buildZoneElement(zone, {
                      reactKey,
                      onSelect: handleCountrySelect,
                      isSelected:
                        Boolean(normalizedZoneId) && selectedCountry === normalizedZoneId,
                      hasData,
                      fill: getCountryFill(zoneKey),
                      hoverFill: getHoverFill(zoneKey),
                      displayName,
                      baremoInfo,
                    });
                  })}
                </g>
              </svg>
              {isSummaryLoading && originZone && selectedService && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700" />
                    {`Calculando baremos para ${originZone}...`}
                  </div>
                </div>
              )}
              <DraggableLegend
                entries={legendEntries}
                containerRef={mapContainerRef}
                anchor="bottom-right"
              />
            </div>
          </div>

          <aside className={asideCardClass}>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Resumen de baremos</h2>
            {!selectedService && (
              <p className="text-sm text-slate-600">
                {variant === 'embedded'
                  ? 'Selecciona primero un servicio en el panel del mapa ibérico.'
                  : 'Selecciona primero un servicio para consultar los baremos internacionales.'}
              </p>
            )}

            {selectedService && !originZone && (
              <p className="text-sm text-slate-600">
                {variant === 'embedded'
                  ? 'Selecciona un origen en el mapa ibérico para ver los destinos internacionales.'
                      : 'Selecciona un origen en el mapa ibérico antes de consultar los baremos internacionales.'}
              </p>
            )}

            {selectedService && originZone && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase text-slate-500">Origen seleccionado</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {selectedName}{' '}
                    <span className="text-slate-500 text-sm">({originZone})</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {variant === 'embedded'
                      ? 'Puedes cambiar el origen directamente haciendo clic en el mapa superior.'
                      : 'Para cambiar el origen vuelve al mapa iberico.'}
                  </p>
                </div>

                {summaryError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {summaryError}
                  </p>
                )}

                {!summaryError && (
                  <div className="border-t border-slate-200 pt-3">
                    <div className="mb-3">
                      <p className="text-xs uppercase text-slate-500">Destino resaltado</p>
                      {selectedCountry ? (
                        <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                          <div className="font-semibold text-slate-900">
                            {selectedCountry}{' '}
                            {selectedDestination?.destin_zone_name
                              ? `- ${selectedDestination.destin_zone_name}`
                              : ''}
                          </div>
                          <div className="text-xs mt-1">
                            Baremo:{' '}
                            <span className="font-semibold">
                              {selectedDestination?.zone_code ?? 'NP'}
                            </span>{' '}
                            -{' '}
                            {selectedDestination?.is_available ? 'Disponible' : 'No disponible'}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">
                          Haz clic en un país para ver el baremo.
                        </p>
                      )}
                    </div>

                    <p className="text-xs uppercase text-slate-500 mb-2">
                      Destinos disponibles ({destinations.length})
                    </p>
                    {destinations.length === 0 ? (
                      <p className="text-sm text-slate-600 bg-slate-100 border border-dashed border-slate-300 rounded-md px-3 py-2">
                        No se encontraron destinos configurados para este origen con el servicio
                        seleccionado.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-auto pr-1">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase text-slate-500">
                              <th className="pb-2">Destino</th>
                              <th className="pb-2">Baremo</th>
                              <th className="pb-2 text-right">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {destinations.map((destination, idx) => {
                              const isSelected =
                                normalizeCountryId(destination.destin_zone_code) ===
                                normalizeCountryId(selectedDestinationCode);
                              const rowKey = `${destination.destin_zone_code ?? 'unknown'}-${destination.zone_code ?? 'NP'}-${idx}`;
                              return (
                                <tr
                                  key={rowKey}
                                  className={`transition-colors ${
                                    isSelected ? 'bg-slate-100/70' : 'hover:bg-slate-50'
                                  } cursor-pointer`}
                                  onClick={() => {
                                    setSelectedDestinationCode(
                                      normalizeCountryId(destination.destin_zone_code),
                                    );
                                    setSelectedCountry(
                                      extractCountryCode(
                                        normalizeCountryId(destination.destin_zone_code),
                                      ) ?? null,
                                    );
                                  }}
                                >
                                  <td className="py-1 pr-2 text-slate-700">
                                    <span className="font-semibold text-slate-900">
                                      {destination.destin_zone_code || '-'}
                                    </span>
                                    {destination.destin_zone_name
                                      ? ` - ${destination.destin_zone_name}`
                                      : ''}
                                  </td>
                                  <td className="py-1 pr-2 text-slate-700">
                                    {destination.zone_code ?? 'NP'}
                                  </td>
                                  <td className="py-1 text-right">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                                        destination.is_available
                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                                      }`}
                                    >
                                      {destination.is_available ? 'Disponible' : 'No disponible'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {selectedSummary && (
                  <p className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-2 py-1">
                    Informacion base: {selectedSummary.displayName} dispone de{' '}
                    {selectedSummary.zones.length} zonas registradas en MongoDB.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );

  return renderWithLayout(content);
}

export function WorldMapPage(): JSX.Element {
  const navigate = useNavigate();
  const { mapMode } = useShippingMap();

  useEffect(() => {
    if (mapMode === 'iberia') {
      navigate('/', { replace: true });
    }
  }, [mapMode, navigate]);

  return <WorldMapScreen variant="full" />;
}

function extractCountryCode(code: string | null | undefined): string | null {
  if (typeof code !== 'string') {
    return null;
  }
  const trimmed = code.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  const match = upper.match(/^[A-Z]{2}/);
  return match ? match[0] : null;
}

function pickPreferredDestination(list: DestinationSummary[]): DestinationSummary | undefined {
  if (!list.length) {
    return undefined;
  }

  return (
    list.find(
      (destination) =>
        destination.is_available && destination.zone_code && destination.zone_code !== 'NP',
    ) ??
    list.find((destination) => destination.zone_code && destination.zone_code !== 'NP') ?? list[0]
  );
}
