import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Package, Edit2, X, Check } from 'lucide-react';
import { configManager, ProductsAvailability } from '../../services/configManager';
import type { OriginType } from '../../types/map';

interface Product {
  id: string;
  code: string;
  name: string;
  map_code: string;
  is_active: boolean;
  origins: OriginType[];
}

const ORIGIN_LABELS: Record<OriginType, string> = {
  peninsula: 'Península',
  canarias: 'Canarias',
  baleares: 'Baleares',
  islas_portugal: 'Islas Portugal'
};

const AVAILABLE_MAPS = [
  { id: 'iberian_map', name: 'Mapa Ibérico' },
  { id: 'world_map', name: 'Mapa Mundial' },
  { id: 'europe_map', name: 'Mapa Europa' }
];

export function ProductsMaster() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formMapCode, setFormMapCode] = useState('iberian_map');
  const [formOrigins, setFormOrigins] = useState<OriginType[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      // Load from products availability config
      const config = await configManager.loadProductsAvailability();

      // Transform to products list
      const allProducts: Product[] = [];
      let id = 1;

      Object.entries(config).forEach(([origin, productNames]) => {
        productNames.forEach((productName) => {
          const existing = allProducts.find(p => p.name === productName);
          if (existing) {
            if (!existing.origins.includes(origin as OriginType)) {
              existing.origins.push(origin as OriginType);
            }
          } else {
            allProducts.push({
              id: `prod-${id++}`,
              code: productName.replace(/\s+/g, '_').toUpperCase(),
              name: productName,
              map_code: 'iberian_map',
              is_active: true,
              origins: [origin as OriginType]
            });
          }
        });
      });

      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProducts = async () => {
    setIsSaving(true);
    try {
      // Transform products back to ProductsAvailability format
      const config: ProductsAvailability = {
        peninsula: [],
        canarias: [],
        baleares: [],
        islas_portugal: []
      };

      products.forEach((product) => {
        if (product.is_active) {
          product.origins.forEach((origin) => {
            if (!config[origin].includes(product.name)) {
              config[origin].push(product.name);
            }
          });
        }
      });

      await configManager.saveProductsAvailability(config);
      setHasChanges(false);
      alert('Productos guardados exitosamente');
    } catch (error) {
      console.error('Error saving products:', error);
      alert('Error al guardar los productos');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = () => {
    if (!formCode.trim() || !formName.trim() || formOrigins.length === 0) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      map_code: formMapCode,
      is_active: formIsActive,
      origins: [...formOrigins]
    };

    setProducts([...products, newProduct]);
    setHasChanges(true);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
    setHasChanges(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
      setHasChanges(true);
    }
  };

  const toggleOrigin = (origin: OriginType) => {
    setFormOrigins(prev =>
      prev.includes(origin)
        ? prev.filter(o => o !== origin)
        : [...prev, origin]
    );
  };

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormMapCode('iberian_map');
    setFormOrigins([]);
    setFormIsActive(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-red-900" />
            Maestro de Productos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Crea y gestiona productos con sus códigos y mapas asociados
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
          {hasChanges && (
            <button
              onClick={saveProducts}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No hay productos configurados</p>
            <p className="text-sm mt-1">Comienza agregando tu primer producto</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mapa Asociado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Orígenes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                    {product.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {AVAILABLE_MAPS.find(m => m.id === product.map_code)?.name || product.map_code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.origins.map(origin => (
                        <span
                          key={origin}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {ORIGIN_LABELS[origin]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleUpdateProduct(product.id, { is_active: !product.is_active })}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                        product.is_active
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Nuevo Producto</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código del Producto <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="CTT_24H"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Producto <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="CTT 24h"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mapa Asociado
                </label>
                <select
                  value={formMapCode}
                  onChange={(e) => setFormMapCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {AVAILABLE_MAPS.map(map => (
                    <option key={map.id} value={map.id}>{map.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orígenes Disponibles <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ORIGIN_LABELS) as OriginType[]).map((origin) => (
                    <button
                      key={origin}
                      type="button"
                      onClick={() => toggleOrigin(origin)}
                      className={`flex items-center justify-between px-4 py-2 rounded-md border transition-colors ${
                        formOrigins.includes(origin)
                          ? 'bg-red-50 border-red-300 text-red-900'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{ORIGIN_LABELS[origin]}</span>
                      {formOrigins.includes(origin) && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Producto activo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
