import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { configManager, ZoneGroups } from '../../services/configManager';

export function ZoneGroupsManager() {
  const [zoneGroups, setZoneGroups] = useState<ZoneGroups>({});
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  const [newZoneInputs, setNewZoneInputs] = useState<Record<string, string>>({});
  const [groupUsage, setGroupUsage] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [groups, zones] = await Promise.all([
        configManager.loadZoneGroups(),
        configManager.getAvailableZonesFromMap()
      ]);

      setZoneGroups(groups);
      setAvailableZones(zones);

      // Load usage for all groups
      const usage: Record<string, string[]> = {};
      for (const groupName of Object.keys(groups)) {
        usage[groupName] = await configManager.getGroupUsage(groupName);
      }
      setGroupUsage(usage);
    } catch (err) {
      console.error('Error loading zone groups:', err);
      setError('Error al cargar la configuración de grupos de zonas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = () => {
    const trimmedName = newGroupName.trim().toUpperCase().replace(/\s+/g, '_');

    if (!trimmedName) {
      setError('El nombre del grupo no puede estar vacío');
      return;
    }

    if (zoneGroups[trimmedName]) {
      setError('Ya existe un grupo con ese nombre');
      return;
    }

    if (!/^[A-Z_]+$/.test(trimmedName)) {
      setError('El nombre debe contener solo letras mayúsculas y guiones bajos');
      return;
    }

    const updated = {
      ...zoneGroups,
      [trimmedName]: []
    };

    setZoneGroups(updated);
    setGroupUsage({ ...groupUsage, [trimmedName]: [] });
    setNewGroupName('');
    setShowCreateGroupForm(false);
    setHasChanges(true);
    setError(null);

    // Auto-expand the new group
    setExpandedGroups(new Set([...expandedGroups, trimmedName]));
  };

  const handleAddZone = (groupName: string) => {
    const zoneId = newZoneInputs[groupName]?.trim();

    if (!zoneId) {
      setError('Debe ingresar un ID de zona');
      return;
    }

    if (!availableZones.includes(zoneId)) {
      setError(`La zona "${zoneId}" no existe en el mapa`);
      return;
    }

    if (zoneGroups[groupName]?.includes(zoneId)) {
      setError(`La zona "${zoneId}" ya está en este grupo`);
      return;
    }

    const updated = {
      ...zoneGroups,
      [groupName]: [...(zoneGroups[groupName] || []), zoneId]
    };

    setZoneGroups(updated);
    setNewZoneInputs({ ...newZoneInputs, [groupName]: '' });
    setHasChanges(true);
    setError(null);
  };

  const handleRemoveZone = (groupName: string, zoneId: string) => {
    const updated = {
      ...zoneGroups,
      [groupName]: zoneGroups[groupName].filter(z => z !== zoneId)
    };

    setZoneGroups(updated);
    setHasChanges(true);
  };

  const handleDeleteGroup = async (groupName: string) => {
    // Check if group is in use
    const usage = groupUsage[groupName] || [];
    if (usage.length > 0) {
      setError(`No se puede eliminar el grupo "${groupName}" porque está en uso en: ${usage.join(', ')}`);
      return;
    }

    if (!confirm(`¿Está seguro de eliminar el grupo "${groupName}"?`)) {
      return;
    }

    const { [groupName]: removed, ...remaining } = zoneGroups;
    setZoneGroups(remaining);
    setHasChanges(true);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await configManager.saveZoneGroups(zoneGroups);
      setHasChanges(false);
      setError(null);
      alert('Grupos de zonas guardados exitosamente');
    } catch (err) {
      console.error('Error saving zone groups:', err);
      setError('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGroupExpansion = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Get autocomplete suggestions for zone input
  const getZoneSuggestions = (groupName: string): string[] => {
    const input = newZoneInputs[groupName]?.toLowerCase() || '';
    if (!input) return [];

    const groupZones = zoneGroups[groupName] || [];
    return availableZones
      .filter(zone =>
        zone.toLowerCase().includes(input) &&
        !groupZones.includes(zone)
      )
      .slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900" />
      </div>
    );
  }

  const sortedGroupNames = Object.keys(zoneGroups).sort();

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Gestión de Grupos de Zonas
        </h2>
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Create New Group */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {!showCreateGroupForm ? (
          <button
            onClick={() => setShowCreateGroupForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear Nuevo Grupo
          </button>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Crear Nuevo Grupo
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                placeholder="Ej: MI_GRUPO_PERSONALIZADO"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
              />
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Crear
              </button>
              <button
                onClick={() => {
                  setShowCreateGroupForm(false);
                  setNewGroupName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Formato: MAYÚSCULAS_CON_GUIONES_BAJOS
            </p>
          </div>
        )}
      </div>

      {/* Zone Groups List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Grupos Existentes ({sortedGroupNames.length})
        </h3>

        {sortedGroupNames.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            No hay grupos de zonas configurados.
            <br />
            Crea un nuevo grupo usando el botón de arriba.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGroupNames.map((groupName) => {
              const zones = zoneGroups[groupName];
              const isExpanded = expandedGroups.has(groupName);
              const usages = groupUsage[groupName] || [];
              const isInUse = usages.length > 0;

              return (
                <div
                  key={groupName}
                  className="bg-white border border-gray-200 rounded-md overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="p-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
                    <button
                      onClick={() => toggleGroupExpansion(groupName)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-mono font-semibold text-gray-900">
                        {groupName}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({zones.length} zonas)
                      </span>
                      {isInUse && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          En uso
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteGroup(groupName)}
                      disabled={isInUse}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isInUse ? `En uso en: ${usages.join(', ')}` : 'Eliminar grupo'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Group Content */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {/* Usage Info */}
                      {isInUse && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm text-blue-900 font-medium mb-1">
                            Este grupo está en uso en:
                          </p>
                          <ul className="text-sm text-blue-800 list-disc list-inside">
                            {usages.map((usage, idx) => (
                              <li key={idx}>{usage}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Add Zone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Añadir Zona
                        </label>
                        <div className="flex gap-2 relative">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={newZoneInputs[groupName] || ''}
                              onChange={(e) => setNewZoneInputs({
                                ...newZoneInputs,
                                [groupName]: e.target.value
                              })}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddZone(groupName)}
                              placeholder="Ej: ES-M, PT-LI, ES-GC-LA"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
                            />
                            {/* Autocomplete Suggestions */}
                            {newZoneInputs[groupName] && getZoneSuggestions(groupName).length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                                {getZoneSuggestions(groupName).map((zone) => (
                                  <button
                                    key={zone}
                                    onClick={() => {
                                      setNewZoneInputs({
                                        ...newZoneInputs,
                                        [groupName]: zone
                                      });
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 font-mono"
                                  >
                                    {zone}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddZone(groupName)}
                            disabled={!newZoneInputs[groupName]?.trim()}
                            className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Zones List */}
                      {zones.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No hay zonas en este grupo. Añade zonas usando el campo de arriba.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zonas del Grupo
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {zones.map((zoneId) => (
                              <div
                                key={zoneId}
                                className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm"
                              >
                                <span className="font-mono text-gray-900">{zoneId}</span>
                                <button
                                  onClick={() => handleRemoveZone(groupName, zoneId)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar zona"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
        <p className="text-sm text-blue-800 mb-2">
          Los grupos de zonas son colecciones de IDs de zonas geográficas que se pueden reutilizar
          en las configuraciones de mapeo de categorías.
        </p>
        <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
          <li>Los nombres de grupos deben estar en MAYÚSCULAS con guiones bajos</li>
          <li>Los IDs de zona deben existir en el mapa SVG</li>
          <li>No se pueden eliminar grupos que están en uso</li>
          <li>Total de zonas disponibles: {availableZones.length}</li>
        </ul>
      </div>
    </div>
  );
}
