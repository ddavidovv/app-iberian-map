import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

interface Zone {
  zone_code: string;
  zone_name: string;
  country?: string;
  group?: string;
}

interface Service {
  code: string;
  name: string;
}

interface HierarchicalFiltersProps {
  // Filters data
  originZones: Zone[];
  destinZones: Zone[];
  originGroups: string[];
  destinGroups: string[];
  services: Service[];

  // Selected values
  selectedOriginCountry: string;
  selectedOriginGroup: string;
  selectedOriginZone: string;
  selectedDestinCountry: string;
  selectedDestinGroup: string;
  selectedDestinZone: string;
  selectedService: string;
  availableOnly: boolean;
  searchTerm: string;

  // Callbacks
  onOriginCountryChange: (value: string) => void;
  onOriginGroupChange: (value: string) => void;
  onOriginZoneChange: (value: string) => void;
  onDestinCountryChange: (value: string) => void;
  onDestinGroupChange: (value: string) => void;
  onDestinZoneChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onAvailableOnlyChange: (value: boolean) => void;
  onSearchTermChange: (value: string) => void;
  onClearFilters: () => void;
}

export function HierarchicalFilters({
  originZones,
  destinZones,
  originGroups,
  destinGroups,
  services,
  selectedOriginCountry,
  selectedOriginGroup,
  selectedOriginZone,
  selectedDestinCountry,
  selectedDestinGroup,
  selectedDestinZone,
  selectedService,
  availableOnly,
  searchTerm,
  onOriginCountryChange,
  onOriginGroupChange,
  onOriginZoneChange,
  onDestinCountryChange,
  onDestinGroupChange,
  onDestinZoneChange,
  onServiceChange,
  onAvailableOnlyChange,
  onSearchTermChange,
  onClearFilters
}: HierarchicalFiltersProps) {

  // Extract unique countries from zone codes with full names from zones collection
  const originCountries = useMemo(() => {
    const countryMap = new Map<string, { code: string; name: string }>();

    // Hardcoded names for ES and PT
    const hardcodedNames: { [key: string]: string } = {
      'ES': 'España',
      'PT': 'Portugal'
    };

    originZones.forEach((zone) => {
      let countryCode = '';
      if (zone.country) {
        countryCode = zone.country;
      } else if (zone.zone_code?.includes('-')) {
        countryCode = zone.zone_code.split('-')[0];
      }

      if (countryCode && !countryMap.has(countryCode)) {
        const countryName = hardcodedNames[countryCode] || zone.zone_name || countryCode;
        countryMap.set(countryCode, {
          code: countryCode,
          name: countryName
        });
      }
    });

    return Array.from(countryMap.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((country) => ({
        value: country.code,
        label: `${country.name} (${country.code})`
      }));
  }, [originZones]);

  const destinCountries = useMemo(() => {
    const countryMap = new Map<string, { code: string; name: string }>();

    // Hardcoded names for ES and PT
    const hardcodedNames: { [key: string]: string } = {
      'ES': 'España',
      'PT': 'Portugal'
    };

    destinZones.forEach((zone) => {
      let countryCode = '';
      if (zone.country) {
        countryCode = zone.country;
      } else if (zone.zone_code?.includes('-')) {
        countryCode = zone.zone_code.split('-')[0];
      }

      if (countryCode && !countryMap.has(countryCode)) {
        const countryName = hardcodedNames[countryCode] || zone.zone_name || countryCode;
        countryMap.set(countryCode, {
          code: countryCode,
          name: countryName
        });
      }
    });

    return Array.from(countryMap.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((country) => ({
        value: country.code,
        label: `${country.name} (${country.code})`
      }));
  }, [destinZones]);

  const originGroupOptions = useMemo(() => {
    const groups = new Set<string>();
    originGroups.forEach((group) => {
      if (group) {
        groups.add(group);
      }
    });
    originZones.forEach((zone) => {
      if (zone.group) {
        groups.add(zone.group);
      }
    });
    return Array.from(groups).sort();
  }, [originGroups, originZones]);

  const filteredOriginGroups = useMemo(() => {
    if (!selectedOriginCountry) {
      return originGroupOptions;
    }

    const groupsForCountry = new Set(
      originZones
        .filter((zone) => {
          if (zone.country) {
            return zone.country === selectedOriginCountry;
          }
          return zone.zone_code?.startsWith(`${selectedOriginCountry}-`);
        })
        .map((zone) => zone.group)
        .filter((group): group is string => Boolean(group))
    );

    return originGroupOptions.filter((group) => groupsForCountry.has(group));
  }, [originGroupOptions, originZones, selectedOriginCountry]);

  const destinGroupOptions = useMemo(() => {
    const groups = new Set<string>();
    destinGroups.forEach((group) => {
      if (group) {
        groups.add(group);
      }
    });
    destinZones.forEach((zone) => {
      if (zone.group) {
        groups.add(zone.group);
      }
    });
    return Array.from(groups).sort();
  }, [destinGroups, destinZones]);

  const filteredDestinGroups = useMemo(() => {
    if (!selectedDestinCountry) {
      return destinGroupOptions;
    }

    const groupsForCountry = new Set(
      destinZones
        .filter((zone) => {
          if (zone.country) {
            return zone.country === selectedDestinCountry;
          }
          return zone.zone_code?.startsWith(`${selectedDestinCountry}-`);
        })
        .map((zone) => zone.group)
        .filter((group): group is string => Boolean(group))
    );

    return destinGroupOptions.filter((group) => groupsForCountry.has(group));
  }, [destinGroupOptions, destinZones, selectedDestinCountry]);

  // Filter zones based on selected country and group
  const filteredOriginZones = useMemo(() => {
    let zones = originZones;

    if (selectedOriginCountry) {
      zones = zones.filter((zone) => {
        if (zone.country) {
          return zone.country === selectedOriginCountry;
        }
        return zone.zone_code.startsWith(`${selectedOriginCountry}-`);
      });
    }

    if (selectedOriginGroup) {
      const groupLower = selectedOriginGroup.toLowerCase();
      zones = zones.filter((zone) => {
        if (zone.group) {
          return zone.group === selectedOriginGroup;
        }
        return (
          zone.zone_code.toLowerCase().includes(groupLower) ||
          zone.zone_name.toLowerCase().includes(groupLower)
        );
      });
    }

    return zones
      .map((zone) => ({
        value: zone.zone_code,
        label: zone.zone_code,
        sublabel: zone.zone_name
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [originZones, selectedOriginCountry, selectedOriginGroup]);

  const filteredDestinZones = useMemo(() => {
    let zones = destinZones;

    if (selectedDestinCountry) {
      zones = zones.filter((zone) => {
        if (zone.country) {
          return zone.country === selectedDestinCountry;
        }
        return zone.zone_code.startsWith(`${selectedDestinCountry}-`);
      });
    }

    if (selectedDestinGroup) {
      const groupLower = selectedDestinGroup.toLowerCase();
      zones = zones.filter((zone) => {
        if (zone.group) {
          return zone.group === selectedDestinGroup;
        }
        return (
          zone.zone_code.toLowerCase().includes(groupLower) ||
          zone.zone_name.toLowerCase().includes(groupLower)
        );
      });
    }

    return zones
      .map((zone) => ({
        value: zone.zone_code,
        label: zone.zone_code,
        sublabel: zone.zone_name
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [destinZones, selectedDestinCountry, selectedDestinGroup]);

  const serviceOptions = useMemo(() => {
    return services.map(s => ({ value: s.code, label: s.code, sublabel: s.name }));
  }, [services]);

  const activeFiltersCount = [
    selectedOriginCountry,
    selectedOriginGroup,
    selectedOriginZone,
    selectedDestinCountry,
    selectedDestinGroup,
    selectedDestinZone,
    selectedService,
    availableOnly,
    searchTerm
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header with active filters count */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
          {activeFiltersCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar todos
          </button>
        )}
      </div>

      {/* General Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Búsqueda General
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder="Buscar por código, nombre, grupo..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOriginCountry && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              País Origen: {selectedOriginCountry}
              <button onClick={() => onOriginCountryChange('')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedOriginGroup && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Grupo Origen: {selectedOriginGroup}
              <button onClick={() => onOriginGroupChange('')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedOriginZone && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Zona Origen: {selectedOriginZone}
              <button onClick={() => onOriginZoneChange('')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDestinCountry && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              País Destino: {selectedDestinCountry}
              <button onClick={() => onDestinCountryChange('')} className="hover:text-purple-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDestinGroup && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              Grupo Destino: {selectedDestinGroup}
              <button onClick={() => onDestinGroupChange('')} className="hover:text-purple-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDestinZone && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              Zona Destino: {selectedDestinZone}
              <button onClick={() => onDestinZoneChange('')} className="hover:text-purple-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedService && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Servicio: {selectedService}
              <button onClick={() => onServiceChange('')} className="hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {availableOnly && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              Solo disponibles
              <button onClick={() => onAvailableOnlyChange(false)} className="hover:text-green-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Hierarchical Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ORIGIN FILTERS */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Filtros de Origen</h4>

          {/* Origin Country - Hybrid Selection (Buttons + Dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">1. País</label>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Main countries as buttons (ES, PT) */}
              {['ES', 'PT'].map((countryCode) => {
                const country = originCountries.find(c => c.value === countryCode);
                if (!country) return null;
                return (
                  <button
                    key={country.value}
                    onClick={() => {
                      const newValue = selectedOriginCountry === country.value ? '' : country.value;
                      onOriginCountryChange(newValue);
                      if (newValue !== selectedOriginCountry) {
                        onOriginGroupChange('');
                        onOriginZoneChange('');
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedOriginCountry === country.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-blue-900 border border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {country.label}
                  </button>
                );
              })}

              {/* Other countries in dropdown */}
              <SearchableSelect
                label=""
                options={originCountries.filter(c => c.value !== 'ES' && c.value !== 'PT')}
                value={selectedOriginCountry && selectedOriginCountry !== 'ES' && selectedOriginCountry !== 'PT' ? selectedOriginCountry : ''}
                onChange={(value) => {
                  onOriginCountryChange(value);
                  if (value !== selectedOriginCountry) {
                    onOriginGroupChange('');
                    onOriginZoneChange('');
                  }
                }}
                placeholder="Otros países..."
              />

              {selectedOriginCountry && (
                <button
                  onClick={() => {
                    onOriginCountryChange('');
                    onOriginGroupChange('');
                    onOriginZoneChange('');
                  }}
                  className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  title="Limpiar selección"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Origin Group */}
          <SearchableSelect
            label="2. Grupo"
            options={filteredOriginGroups.map(g => ({ value: g, label: g }))}
            value={selectedOriginGroup}
            onChange={(value) => {
              onOriginGroupChange(value);
              // Clear dependent filters
              if (value !== selectedOriginGroup) {
                onOriginZoneChange('');
              }
            }}
            placeholder="Seleccionar grupo..."
            disabled={false}
          />

          {/* Origin Zone */}
          <SearchableSelect
            label="3. Zona"
            options={filteredOriginZones}
            value={selectedOriginZone}
            onChange={onOriginZoneChange}
            placeholder="Seleccionar zona..."
            disabled={false}
          />
        </div>

        {/* DESTINATION FILTERS */}
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">Filtros de Destino</h4>

          {/* Destin Country - Hybrid Selection (Buttons + Dropdown) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">1. País</label>
            <div className="flex gap-2 items-center flex-wrap">
              {/* Main countries as buttons (ES, PT) */}
              {['ES', 'PT'].map((countryCode) => {
                const country = destinCountries.find(c => c.value === countryCode);
                if (!country) return null;
                return (
                  <button
                    key={country.value}
                    onClick={() => {
                      const newValue = selectedDestinCountry === country.value ? '' : country.value;
                      onDestinCountryChange(newValue);
                      if (newValue !== selectedDestinCountry) {
                        onDestinGroupChange('');
                        onDestinZoneChange('');
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedDestinCountry === country.value
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-purple-900 border border-purple-300 hover:bg-purple-100'
                    }`}
                  >
                    {country.label}
                  </button>
                );
              })}

              {/* Other countries in dropdown */}
              <SearchableSelect
                label=""
                options={destinCountries.filter(c => c.value !== 'ES' && c.value !== 'PT')}
                value={selectedDestinCountry && selectedDestinCountry !== 'ES' && selectedDestinCountry !== 'PT' ? selectedDestinCountry : ''}
                onChange={(value) => {
                  onDestinCountryChange(value);
                  if (value !== selectedDestinCountry) {
                    onDestinGroupChange('');
                    onDestinZoneChange('');
                  }
                }}
                placeholder="Otros países..."
              />

              {selectedDestinCountry && (
                <button
                  onClick={() => {
                    onDestinCountryChange('');
                    onDestinGroupChange('');
                    onDestinZoneChange('');
                  }}
                  className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  title="Limpiar selección"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Destin Group */}
          <SearchableSelect
            label="2. Grupo"
            options={filteredDestinGroups.map(g => ({ value: g, label: g }))}
            value={selectedDestinGroup}
            onChange={(value) => {
              onDestinGroupChange(value);
              // Clear dependent filters
              if (value !== selectedDestinGroup) {
                onDestinZoneChange('');
              }
            }}
            placeholder="Seleccionar grupo..."
            disabled={false}
          />

          {/* Destin Zone */}
          <SearchableSelect
            label="3. Zona"
            options={filteredDestinZones}
            value={selectedDestinZone}
            onChange={onDestinZoneChange}
            placeholder="Seleccionar zona..."
            disabled={false}
          />
        </div>
      </div>

      {/* Additional Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <SearchableSelect
          label="Servicio"
          options={serviceOptions}
          value={selectedService}
          onChange={onServiceChange}
          placeholder="Seleccionar servicio..."
        />

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => onAvailableOnlyChange(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Mostrar solo servicios disponibles
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
