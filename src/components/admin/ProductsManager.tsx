import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { configManager, ProductsAvailability } from '../../services/configManager';
import type { OriginType } from '../../types/map';

const ORIGIN_LABELS: Record<OriginType, string> = {
  peninsula: 'Península',
  canarias: 'Canarias',
  baleares: 'Baleares',
  islas_portugal: 'Islas Portugal'
};

export function ProductsManager() {
  const [productsAvailability, setProductsAvailability] = useState<ProductsAvailability>({});
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('peninsula');
  const [newProductName, setNewProductName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const config = await configManager.loadProductsAvailability();
      setProductsAvailability(config);
    } catch (error) {
      console.error('Error loading products availability:', error);
      // Initialize with empty arrays if loading fails
      setProductsAvailability({
        peninsula: [],
        canarias: [],
        baleares: [],
        islas_portugal: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (!newProductName.trim()) return;

    const updated = {
      ...productsAvailability,
      [selectedOrigin]: [
        ...(productsAvailability[selectedOrigin] || []),
        newProductName.trim()
      ]
    };

    setProductsAvailability(updated);
    setNewProductName('');
    setHasChanges(true);
  };

  const handleRemoveProduct = (productName: string) => {
    const updated = {
      ...productsAvailability,
      [selectedOrigin]: (productsAvailability[selectedOrigin] || []).filter(
        p => p !== productName
      )
    };

    setProductsAvailability(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await configManager.saveProductsAvailability(productsAvailability);
      setHasChanges(false);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900" />
      </div>
    );
  }

  const currentProducts = productsAvailability[selectedOrigin] || [];

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Gestión de Productos por Origen
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

      {/* Origin Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Origen
        </label>
        <select
          value={selectedOrigin}
          onChange={(e) => setSelectedOrigin(e.target.value as OriginType)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {(Object.keys(ORIGIN_LABELS) as OriginType[]).map((origin) => (
            <option key={origin} value={origin}>
              {ORIGIN_LABELS[origin]}
            </option>
          ))}
        </select>
      </div>

      {/* Add New Product */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Agregar Nuevo Producto
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
            placeholder="Nombre del producto"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleAddProduct}
            disabled={!newProductName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Products List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Productos Disponibles para {ORIGIN_LABELS[selectedOrigin]} ({currentProducts.length})
        </h3>
        {currentProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            No hay productos configurados para este origen.
            <br />
            Agrega productos usando el formulario de arriba.
          </div>
        ) : (
          <div className="space-y-2">
            {currentProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
              >
                <span className="text-gray-900">{product}</span>
                <button
                  onClick={() => handleRemoveProduct(product)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Message */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
          </p>
        </div>
      )}
    </div>
  );
}
