import React, { useState } from 'react';
import { Map as MapIconLucide, Upload, Eye, Trash2, Save, AlertCircle } from 'lucide-react';

interface MapConfig {
  id: string;
  name: string;
  svg_path: string;
  description: string;
  is_active: boolean;
  zone_groups: string[];
  created_at: string;
}

export function MapsMaster() {
  const [maps, setMaps] = useState<MapConfig[]>([
    {
      id: 'iberian_map',
      name: 'Mapa Ibérico',
      svg_path: '/assets/iberian_map.svg',
      description: 'Mapa de la Península Ibérica con zonas de España y Portugal',
      is_active: true,
      zone_groups: ['ES', 'PT'],
      created_at: '2024-01-15'
    }
  ]);
  const [selectedMap, setSelectedMap] = useState<MapConfig | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSelectMap = (map: MapConfig) => {
    setSelectedMap(map);
  };

  const handleDeleteMap = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este mapa?')) {
      setMaps(maps.filter(m => m.id !== id));
      if (selectedMap?.id === id) {
        setSelectedMap(null);
      }
      setHasChanges(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <MapIconLucide className="w-7 h-7 text-red-900" />
            Maestro de Mapas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona los mapas SVG disponibles en el sistema
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors font-medium"
        >
          <Upload className="w-4 h-4" />
          Subir Nuevo Mapa
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 text-sm">Funcionalidad en desarrollo</h3>
            <p className="text-sm text-blue-800 mt-1">
              El maestro de mapas permitirá subir nuevos archivos SVG, parsear automáticamente las zonas,
              asignar zone-groups y previsualizar los mapas con overlay de zonas detectadas.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              Por ahora, el mapa Ibérico está configurado por defecto. Esta funcionalidad se completará en la siguiente fase.
            </p>
          </div>
        </div>
      </div>

      {/* Maps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maps.map((map) => (
          <div
            key={map.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleSelectMap(map)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapIconLucide className="w-5 h-5 text-red-900" />
                  <h3 className="font-semibold text-gray-900">{map.name}</h3>
                </div>
                {map.is_active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{map.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Grupos: {map.zone_groups.join(', ')}</span>
                <span>{new Date(map.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Preview próximamente disponible');
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Previsualizar"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMap(map.id);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Map Details */}
      {selectedMap && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Mapa</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <p className="text-sm text-gray-900 font-mono">{selectedMap.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruta SVG</label>
              <p className="text-sm text-gray-900 font-mono">{selectedMap.svg_path}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona Groups</label>
              <p className="text-sm text-gray-900">{selectedMap.zone_groups.join(', ')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
              <p className="text-sm text-gray-900">{new Date(selectedMap.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir Nuevo Mapa</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                Esta funcionalidad estará disponible en la siguiente fase de desarrollo.
                Permitirá subir archivos SVG y configurar zonas automáticamente.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
