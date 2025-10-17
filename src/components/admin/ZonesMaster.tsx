import React, { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, CheckCircle, FileWarning, Download, Upload, Save } from 'lucide-react';
import { configManager } from '../../services/configManager';
import type { ZonesMaster, ZoneMasterEntry, ZoneStatus } from '../../types/map';

const STATUS_CONFIG: Record<ZoneStatus, { label: string; color: string; icon: React.ReactNode }> = {
  ok: {
    label: 'OK',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="w-3 h-3" />
  },
  warning: {
    label: 'Warning',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertTriangle className="w-3 h-3" />
  },
  svg_only: {
    label: 'Solo SVG',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <FileWarning className="w-3 h-3" />
  },
  excel_only: {
    label: 'Solo Excel',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <FileWarning className="w-3 h-3" />
  }
};

export function ZonesMaster() {
  const [zonesMaster, setZonesMaster] = useState<ZonesMaster>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<ZoneStatus | 'all'>('all');
  const [filterCCAA, setFilterCCAA] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const zones = await configManager.loadZonesMaster();
      setZonesMaster(zones);
      setHasChanges(false);
    } catch (err) {
      console.error('Error loading zones master:', err);
      setError('Error al cargar el maestro de zonas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await configManager.saveZonesMaster(zonesMaster);
      setHasChanges(false);
      setError(null);
      alert('Maestro de zonas guardado exitosamente');
    } catch (err) {
      console.error('Error saving zones master:', err);
      setError('Error al guardar el maestro de zonas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(zonesMaster, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zones-master-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setZonesMaster(imported);
        setHasChanges(true);
        alert('Configuración importada correctamente');
      } catch (err) {
        alert('Error al importar: archivo JSON inválido');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateZone = (zoneId: string, updates: Partial<ZoneMasterEntry>) => {
    setZonesMaster(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        ...updates
      }
    }));
    setHasChanges(true);
  };

  // Get unique values for filters
  const uniqueCountries = useMemo(() => {
    const countries = new Set(Object.values(zonesMaster).map(z => z.country_code));
    return Array.from(countries).filter(Boolean).sort();
  }, [zonesMaster]);

  const uniqueCCAAValues = useMemo(() => {
    const ccaas = new Set(Object.values(zonesMaster).map(z => z.zone_ccaa));
    return Array.from(ccaas).filter(Boolean).sort();
  }, [zonesMaster]);

  // Filtered zones
  const filteredZones = useMemo(() => {
    return Object.values(zonesMaster).filter(zone => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !zone.zone_code.toLowerCase().includes(term) &&
          !zone.zone_name.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      // Country filter
      if (filterCountry !== 'all' && zone.country_code !== filterCountry) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && zone.status !== filterStatus) {
        return false;
      }

      // CCAA filter
      if (filterCCAA !== 'all' && zone.zone_ccaa !== filterCCAA) {
        return false;
      }

      return true;
    }).sort((a, b) => a.zone_code.localeCompare(b.zone_code));
  }, [zonesMaster, searchTerm, filterCountry, filterStatus, filterCCAA]);

  // Statistics
  const stats = useMemo(() => {
    const zones = Object.values(zonesMaster);
    return {
      total: zones.length,
      ok: zones.filter(z => z.status === 'ok').length,
      warning: zones.filter(z => z.status === 'warning').length,
      svg_only: zones.filter(z => z.status === 'svg_only').length,
      excel_only: zones.filter(z => z.status === 'excel_only').length
    };
  }, [zonesMaster]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Maestro de Zonas
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Zonas</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{stats.ok}</div>
          <div className="text-sm text-green-700">OK</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-900">{stats.warning}</div>
          <div className="text-sm text-yellow-700">Warnings</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-900">{stats.svg_only}</div>
          <div className="text-sm text-orange-700">Solo SVG</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.excel_only}</div>
          <div className="text-sm text-gray-700">Solo Excel</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar código o nombre..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          {/* Country Filter */}
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="all">Todos los países</option>
            {uniqueCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ZoneStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>{config.label}</option>
            ))}
          </select>

          {/* CCAA Filter */}
          <select
            value={filterCCAA}
            onChange={(e) => setFilterCCAA(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="all">Todas las CCAA</option>
            {uniqueCCAAValues.map(ccaa => (
              <option key={ccaa} value={ccaa}>{ccaa}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Mostrando {filteredZones.length} de {stats.total} zonas
      </div>

      {/* Zones Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">País</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">CCAA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">En SVG</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredZones.map((zone) => {
                const statusConfig = STATUS_CONFIG[zone.status];
                return (
                  <tr key={zone.zone_code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                      {zone.zone_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {zone.zone_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {zone.country_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {zone.zone_ccaa}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {zone.zone_group}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {zone.in_svg ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${statusConfig.color}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {zone.warning_reason && (
                          <span
                            className="text-xs text-gray-500 cursor-help"
                            title={zone.warning_reason}
                          >
                            ⓘ
                          </span>
                        )}
                      </div>
                      {zone.warning_reason && (
                        <div className="text-xs text-gray-500 mt-1">
                          {zone.warning_reason}
                        </div>
                      )}
                      {zone.excel_equivalent && (
                        <div className="text-xs text-blue-600 mt-1">
                          Excel: {zone.excel_equivalent}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Changes Warning */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Información</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>OK:</strong> Zona presente en SVG y Excel con datos consistentes</p>
          <p><strong>Warning:</strong> Zona con código inconsistente entre SVG y Excel</p>
          <p><strong>Solo SVG:</strong> Zona presente en el mapa pero sin datos en Excel</p>
          <p><strong>Solo Excel:</strong> Datos disponibles pero zona no renderizable en el mapa</p>
        </div>
      </div>
    </div>
  );
}
