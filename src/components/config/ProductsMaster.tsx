import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Package, Edit2, X, Check, AlertCircle, RefreshCw, Database, ChevronUp, ChevronDown } from 'lucide-react';
import { shippingTypesService } from '../../services/shippingTypesService';
import { shippingTypesServiceV2 } from '../../services/shippingTypesServiceV2';
import { Toast, ToastContainer } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import type { ShippingType, ShippingTypeCategory } from '../../types/shippingTypes';

type DatabaseVersion = 'v1' | 'v2';
type SortField = 'shipping_type_code' | 'shipping_type_name' | 'display_name' | 'category' | 'display_order';
type SortDirection = 'asc' | 'desc';

const CATEGORY_LABELS: Record<ShippingTypeCategory, string> = {
  'B2B': 'B2B - Empresas',
  'B2C': 'B2C - Consumidor',
  'DEV/RET': 'Devolución/Retorno',
  'SPORADIC': 'Esporádico',
  'INTER': 'Internacional'
};

const CATEGORY_COLORS: Record<ShippingTypeCategory, string> = {
  'B2B': 'bg-purple-100 text-purple-800 border-purple-300',
  'B2C': 'bg-blue-100 text-blue-800 border-blue-300',
  'DEV/RET': 'bg-orange-100 text-orange-800 border-orange-300',
  'SPORADIC': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'INTER': 'bg-green-100 text-green-800 border-green-300'
};

export function ProductsMaster() {
  const toast = useToast();
  const [products, setProducts] = useState<ShippingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ShippingType>>({});
  const [databaseVersion, setDatabaseVersion] = useState<DatabaseVersion>('v2');
  const [isSyncing, setIsSyncing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('display_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formRatingMap, setFormRatingMap] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(999);
  const [formCategory, setFormCategory] = useState<ShippingTypeCategory>('B2C');

  useEffect(() => {
    loadProducts();
  }, [databaseVersion]);

  useEffect(() => {
    setProducts(prev => sortProducts([...prev]));
  }, [sortField, sortDirection]);

  const sortProducts = (productsToSort: ShippingType[]): ShippingType[] => {
    return productsToSort.sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'shipping_type_code':
          compareValue = a.shipping_type_code.localeCompare(b.shipping_type_code);
          break;
        case 'shipping_type_name':
          compareValue = a.shipping_type_name.localeCompare(b.shipping_type_name);
          break;
        case 'display_name':
          compareValue = a.display_name.localeCompare(b.display_name);
          break;
        case 'category':
          compareValue = a.category.localeCompare(b.category);
          break;
        case 'display_order':
          compareValue = (a.display_order ?? 999) - (b.display_order ?? 999);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const service = databaseVersion === 'v2' ? shippingTypesServiceV2 : shippingTypesService;
      const response = await service.list();

      const sorted = sortProducts(response.shipping_types);
      setProducts(sorted);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToV2 = async () => {
    if (!confirm('¿Sincronizar todos los productos desde legacy (v1) a v2?')) {
      return;
    }

    try {
      setIsSyncing(true);

      const result = await shippingTypesServiceV2.syncFromLegacy();

      if (result.errors > 0) {
        toast.warning(
          'Sincronización completada',
          `${result.migrated} nuevos, ${result.updated} actualizados, ${result.errors} errores`
        );
      } else {
        toast.success(
          'Sincronización completada',
          `${result.migrated} nuevos productos y ${result.updated} actualizados`
        );
      }

      // Reload v2 data
      if (databaseVersion === 'v2') {
        await loadProducts();
      }
    } catch (error) {
      console.error('Error syncing to v2:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error en sincronización', message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddProduct = async () => {
    if (!formCode.trim() || !formName.trim() || !formDisplayName.trim() || !formRatingMap.trim()) {
      toast.warning('Campos incompletos', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const service = databaseVersion === 'v2' ? shippingTypesServiceV2 : shippingTypesService;
      await service.create({
        shipping_type_code: formCode.trim().toUpperCase(),
        shipping_type_name: formName.trim(),
        display_name: formDisplayName.trim(),
        rating_map: formRatingMap.trim(),
        display_order: formDisplayOrder,
        category: formCategory,
        created_by: 'Admin'
      });

      await loadProducts();
      resetForm();
      setShowAddModal(false);
      toast.success('Producto creado', 'El producto ha sido creado exitosamente');
    } catch (error) {
      console.error('Error creating product:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(message);
      toast.error('Error al crear producto', message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (product: ShippingType) => {
    setEditingCode(product.shipping_type_code);
    setEditFormData({
      shipping_type_name: product.shipping_type_name,
      display_name: product.display_name,
      rating_map: product.rating_map,
      display_order: product.display_order,
      category: product.category
    });
  };

  const cancelEditing = () => {
    setEditingCode(null);
    setEditFormData({});
  };

  const handleUpdateProduct = async (code: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const service = databaseVersion === 'v2' ? shippingTypesServiceV2 : shippingTypesService;
      await service.update(code, {
        ...editFormData,
        updated_by: 'Admin'
      });

      await loadProducts();
      setEditingCode(null);
      setEditFormData({});
      toast.success('Producto actualizado', 'El producto ha sido actualizado exitosamente');
    } catch (error) {
      console.error('Error updating product:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(message);
      toast.error('Error al actualizar producto', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (code: string) => {
    toast.info('Confirmar eliminación', '¿Estás seguro de eliminar este producto?', 0);
    const confirmed = confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.');

    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const service = databaseVersion === 'v2' ? shippingTypesServiceV2 : shippingTypesService;
      await service.delete(code);
      await loadProducts();
      toast.success('Producto eliminado', 'El producto ha sido eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError(message);
      toast.error('Error al eliminar producto', message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormDisplayName('');
    setFormRatingMap('');
    setFormDisplayOrder(999);
    setFormCategory('B2C');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900" />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-red-900" />
            Maestro de Productos (MongoDB)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona productos desde la base de datos MongoDB
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border border-gray-300">
            <Database className="w-4 h-4 text-gray-600" />
            <select
              value={databaseVersion}
              onChange={(e) => setDatabaseVersion(e.target.value as DatabaseVersion)}
              disabled={isLoading}
              className="bg-transparent text-sm font-medium text-gray-900 border-0 focus:outline-none"
            >
              <option value="v1">Base Legacy (v1)</option>
              <option value="v2">Base V2</option>
            </select>
          </div>
          <button
            onClick={handleSyncToV2}
            disabled={isSyncing || isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium text-sm disabled:opacity-50"
            title="Sincronizar datos desde legacy (v1) a v2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar v2'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors font-medium disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

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
                <th colSpan={6} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 bg-gray-100">
                  Mostrando {products.length} productos desde <span className="font-bold text-gray-900">{databaseVersion === 'v2' ? 'Base V2' : 'Base Legacy (v1)'}</span>
                </th>
              </tr>
              <tr>
                <th
                  onClick={() => handleSort('shipping_type_code')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Código
                    {sortField === 'shipping_type_code' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('shipping_type_name')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Nombre
                    {sortField === 'shipping_type_name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('display_name')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Nombre para mostrar
                    {sortField === 'display_name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Categoría
                    {sortField === 'category' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('display_order')}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Orden
                    {sortField === 'display_order' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const isEditing = editingCode === product.shipping_type_code;

                return (
                  <tr key={product.shipping_type_code} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                      {product.shipping_type_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.shipping_type_name ?? product.shipping_type_name}
                          onChange={(e) => setEditFormData({ ...editFormData, shipping_type_name: e.target.value })}
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        product.shipping_type_name
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.display_name ?? product.display_name}
                          onChange={(e) => setEditFormData({ ...editFormData, display_name: e.target.value })}
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        product.display_name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={editFormData.category ?? product.category}
                          onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as ShippingTypeCategory })}
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        >
                          {(Object.keys(CATEGORY_LABELS) as ShippingTypeCategory[]).map((cat) => (
                            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${CATEGORY_COLORS[product.category]}`}>
                          {CATEGORY_LABELS[product.category]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editFormData.display_order ?? product.display_order ?? 999}
                          onChange={(e) => setEditFormData({ ...editFormData, display_order: parseInt(e.target.value) || 999 })}
                          className="w-20 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        />
                      ) : (
                        product.display_order ?? 999
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleUpdateProduct(product.shipping_type_code)}
                              disabled={isSaving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                              title="Guardar cambios"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={isSaving}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(product)}
                              disabled={isSaving || editingCode !== null}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.shipping_type_code)}
                              disabled={isSaving || editingCode !== null}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
                    placeholder="C24"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Tipo de Envío <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="CTT 24"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre para Mostrar <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="CTT 24h"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating Map <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formRatingMap}
                    onChange={(e) => setFormRatingMap(e.target.value)}
                    placeholder="CTT 24h"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 999)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-600">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ShippingTypeCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {(Object.keys(CATEGORY_LABELS) as ShippingTypeCategory[]).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={isSaving}
                className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {isSaving ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
