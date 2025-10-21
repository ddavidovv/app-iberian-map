import { useState, useEffect, useMemo } from 'react';
import { Plus, Copy, X } from 'lucide-react';
import type { RateModelBaremoMatrix, BaremoGroup, ProductAvailability } from '../../types/baremo';
import type { RatesModel } from '../../types/ratesModels';
import {
  getRateModelBaremoMatrix,
  addBaremoGroupToMatrix,
  removeBaremoGroupFromMatrix,
  updateProductAvailability,
  cloneBaremoMatrix,
} from '../../services/baremoMatrixService';
import { listBaremoGroups } from '../../services/baremoGroupsService';
import { ratesModelsService } from '../../services/ratesModelsService';
import { ConfigLayout } from '../../components/layout/ConfigLayout';
import { BaremoToggle } from '../../components/baremo/BaremoToggle';
import { MatrixToolbar } from '../../components/baremo/MatrixToolbar';
import { ProductProgress } from '../../components/baremo/ProductProgress';
import { ProductActionsMenu } from '../../components/baremo/ProductActionsMenu';

export default function BaremoMatrixConfigPage() {
  const [rateModels, setRateModels] = useState<RatesModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [matrix, setMatrix] = useState<RateModelBaremoMatrix | null>(null);
  const [availableGroups, setAvailableGroups] = useState<BaremoGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [selectedGroupToAdd, setSelectedGroupToAdd] = useState<string>('');
  const [sourceModelToClone, setSourceModelToClone] = useState<string>('');

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'partial'>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('');

  // Get current model's products
  const currentModel = rateModels.find(m => m.model_id === selectedModelId);
  const products = currentModel?.products || [];

  // Load rate models and available baremo groups
  useEffect(() => {
    loadRateModels();
    loadAvailableGroups();
  }, []);

  // Load matrix when model changes
  useEffect(() => {
    if (selectedModelId) {
      loadMatrix();
    }
  }, [selectedModelId]);

  const loadRateModels = async () => {
    try {
      const response = await ratesModelsService.list({ limit: 100 });
      setRateModels(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading rate models');
    }
  };

  const loadAvailableGroups = async () => {
    try {
      const response = await listBaremoGroups(undefined, 100, 0);
      setAvailableGroups(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading groups');
    }
  };

  const loadMatrix = async () => {
    if (!selectedModelId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRateModelBaremoMatrix(selectedModelId);
      setMatrix(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading matrix');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async () => {
    if (!selectedGroupToAdd || !selectedModelId) return;

    try {
      setError(null);
      const updatedMatrix = await addBaremoGroupToMatrix(selectedModelId, {
        baremo_group_id: selectedGroupToAdd,
      });
      setMatrix(updatedMatrix);
      setShowAddGroupDialog(false);
      setSelectedGroupToAdd('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding group');
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    if (!selectedModelId || !confirm('¿Eliminar este grupo de la matriz?')) return;

    try {
      setError(null);
      const updatedMatrix = await removeBaremoGroupFromMatrix(selectedModelId, groupId);
      setMatrix(updatedMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing group');
    }
  };

  const handleToggleProduct = async (
    groupId: string,
    baremoId: string,
    productCode: string,
    currentValue: boolean
  ) => {
    if (!selectedModelId) return;

    try {
      setError(null);
      const updatedMatrix = await updateProductAvailability(
        selectedModelId,
        groupId,
        baremoId,
        productCode,
        { is_available: !currentValue }
      );
      setMatrix(updatedMatrix);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating availability');
    }
  };

  const handleCloneMatrix = async () => {
    if (!sourceModelToClone || !selectedModelId) return;

    if (!confirm('¿Clonar la configuración? Esto sobrescribirá la configuración actual.')) return;

    try {
      setError(null);
      const updatedMatrix = await cloneBaremoMatrix(selectedModelId, {
        source_model_id: sourceModelToClone,
      });
      setMatrix(updatedMatrix);
      setShowCloneDialog(false);
      setSourceModelToClone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cloning matrix');
    }
  };

  // Operaciones masivas
  const handleActivateAll = async (productCode: string) => {
    if (!selectedModelId || !matrix) return;

    for (const groupConfig of matrix.baremo_configurations) {
      for (const baremo of groupConfig.baremos) {
        const currentValue = baremo.product_availability[productCode] || false;
        if (!currentValue) {
          await handleToggleProduct(groupConfig.baremo_group_id, baremo.baremo_id, productCode, false);
        }
      }
    }
  };

  const handleDeactivateAll = async (productCode: string) => {
    if (!selectedModelId || !matrix) return;

    for (const groupConfig of matrix.baremo_configurations) {
      for (const baremo of groupConfig.baremos) {
        const currentValue = baremo.product_availability[productCode] || false;
        if (currentValue) {
          await handleToggleProduct(groupConfig.baremo_group_id, baremo.baremo_id, productCode, true);
        }
      }
    }
  };

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    if (!matrix) return products;

    return products.filter((product) => {
      // Filtro de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = product.product_name?.toLowerCase().includes(searchLower);
        const matchesCode = product.product_code.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesCode) return false;
      }

      // Filtro de estado
      if (filterStatus !== 'all') {
        let activeCount = 0;
        let totalCount = 0;

        matrix.baremo_configurations.forEach((groupConfig) => {
          groupConfig.baremos.forEach((baremo) => {
            totalCount++;
            if (baremo.product_availability[product.product_code]) {
              activeCount++;
            }
          });
        });

        if (filterStatus === 'active' && activeCount === 0) return false;
        if (filterStatus === 'inactive' && activeCount > 0) return false;
        if (filterStatus === 'partial' && (activeCount === 0 || activeCount === totalCount)) return false;
      }

      return true;
    });
  }, [products, matrix, searchTerm, filterStatus]);

  // Grupos filtrados para la matriz
  const filteredGroups = useMemo(() => {
    if (!matrix) return [];

    if (selectedGroupFilter) {
      return matrix.baremo_configurations.filter(
        (config) => config.baremo_group_id === selectedGroupFilter
      );
    }

    return matrix.baremo_configurations;
  }, [matrix, selectedGroupFilter]);

  // Get groups that are not yet in the matrix
  const groupsNotInMatrix = availableGroups.filter(
    (group) => !matrix?.baremo_configurations.some((config) => config.baremo_group_id === group.group_id)
  );

  return (
    <ConfigLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Matriz de Disponibilidad de Productos por Baremo
        </h1>

          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Modelo Tarifario:
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccione un modelo --</option>
              {rateModels.map((model) => (
                <option key={model.model_id} value={model.model_id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          {selectedModelId && (
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setShowAddGroupDialog(true)}
                disabled={groupsNotInMatrix.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                + Agregar Grupo de Baremos
              </button>
              <button
                onClick={() => setShowCloneDialog(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Clonar desde otro modelo
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {/* Add Group Dialog */}
          {showAddGroupDialog && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold mb-3">Agregar Grupo de Baremos</h3>
              <select
                value={selectedGroupToAdd}
                onChange={(e) => setSelectedGroupToAdd(e.target.value)}
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Seleccione un grupo --</option>
                {groupsNotInMatrix.map((group) => (
                  <option key={group.group_id} value={group.group_id}>
                    {group.name} ({group.code})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddGroup}
                  disabled={!selectedGroupToAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowAddGroupDialog(false);
                    setSelectedGroupToAdd('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Clone Dialog */}
          {showCloneDialog && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
              <h3 className="font-semibold mb-3">Clonar Configuración</h3>
              <p className="text-sm text-gray-600 mb-3">
                Esto copiará toda la configuración de baremos de otro modelo. Los productos se ajustarán automáticamente.
              </p>
              <select
                value={sourceModelToClone}
                onChange={(e) => setSourceModelToClone(e.target.value)}
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Seleccione modelo origen --</option>
                {rateModels
                  .filter((m) => m.model_id !== selectedModelId)
                  .map((model) => (
                    <option key={model.model_id} value={model.model_id}>
                      {model.name}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCloneMatrix}
                  disabled={!sourceModelToClone}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Clonar
                </button>
                <button
                  onClick={() => {
                    setShowCloneDialog(false);
                    setSourceModelToClone('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Toolbar con búsqueda y filtros */}
          {selectedModelId && matrix && matrix.baremo_configurations.length > 0 && (
            <MatrixToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              selectedGroupFilter={selectedGroupFilter}
              onGroupFilterChange={setSelectedGroupFilter}
              availableGroups={matrix.baremo_configurations.map(g => ({
                group_id: g.baremo_group_id,
                name: g.baremo_group_name,
                code: g.baremo_group_code,
              }))}
              totalProducts={products.length}
              filteredProducts={filteredProducts.length}
            />
          )}

          {/* Matrix Grid */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando matriz...</div>
          ) : !selectedModelId ? (
            <div className="text-center py-8 text-gray-500">
              Seleccione un modelo tarifario para ver su configuración
            </div>
          ) : !matrix || matrix.baremo_configurations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay grupos de baremos configurados. Agregue uno para comenzar.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron productos que coincidan con los filtros.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full border-collapse">
                {/* Table Header - Compacto */}
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-r border-gray-200 px-3 py-1.5 text-left text-xs font-semibold sticky left-0 bg-gray-50 z-10">
                      Producto
                    </th>
                    {filteredGroups.map((groupConfig, groupIndex) => (
                      <th
                        key={groupConfig.baremo_group_id}
                        colSpan={groupConfig.baremos.length}
                        className={`border-r border-gray-300 px-2 py-1 text-center text-xs font-semibold bg-blue-50 ${groupIndex > 0 ? 'border-l-4 border-l-blue-500' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-blue-900">{groupConfig.baremo_group_name}</span>
                          <button
                            onClick={() => handleRemoveGroup(groupConfig.baremo_group_id)}
                            className="text-red-600 hover:text-red-800 p-0.5"
                            title={`Eliminar ${groupConfig.baremo_group_name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="px-2 py-1.5 text-center text-xs font-semibold w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Estado</span>
                        <span className="text-[10px] text-gray-500 font-normal">Acciones</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border-r border-gray-200 px-3 py-1 text-left text-[10px] font-medium text-gray-600 sticky left-0 bg-gray-100 z-10">

                    </th>
                    {filteredGroups.map((groupConfig) =>
                      groupConfig.baremos
                        .sort((a, b) => a.baremo_code.localeCompare(b.baremo_code))
                        .map((baremo, idx) => (
                          <th
                            key={baremo.baremo_id}
                            className="border-r border-gray-200 px-2 py-1 text-center min-w-[48px]"
                            title={`${baremo.baremo_name}`}
                          >
                            <div className="text-xs font-bold text-gray-900">{baremo.baremo_code}</div>
                          </th>
                        ))
                    )}
                    <th className="px-2 py-1"></th>
                  </tr>
                </thead>

                {/* Table Body - Compacto */}
                <tbody className="bg-white">
                  {filteredProducts.map((product) => {
                    // Calcular progreso
                    let activeCount = 0;
                    let totalCount = 0;
                    filteredGroups.forEach((groupConfig) => {
                      groupConfig.baremos.forEach((baremo) => {
                        totalCount++;
                        if (baremo.product_availability[product.product_code]) {
                          activeCount++;
                        }
                      });
                    });

                    return (
                      <tr key={product.product_code} className="hover:bg-gray-50 border-t border-gray-100">
                        <td className="border-r border-gray-200 px-3 py-1.5 sticky left-0 bg-white z-10">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {product.product_name || product.product_code}
                              </div>
                              <div className="text-xs text-gray-500">({product.product_code})</div>
                            </div>
                          </div>
                        </td>
                        {filteredGroups.map((groupConfig) =>
                          groupConfig.baremos
                            .sort((a, b) => a.baremo_code.localeCompare(b.baremo_code))
                            .map((baremo) => {
                              const isAvailable = baremo.product_availability[product.product_code] || false;
                              return (
                                <td
                                  key={`${product.product_code}-${baremo.baremo_id}`}
                                  className="border-r border-gray-200 px-2 py-1.5 text-center"
                                >
                                  <div className="flex justify-center">
                                    <BaremoToggle
                                      isActive={isAvailable}
                                      onToggle={() =>
                                        handleToggleProduct(
                                          groupConfig.baremo_group_id,
                                          baremo.baremo_id,
                                          product.product_code,
                                          isAvailable
                                        )
                                      }
                                      size="sm"
                                    />
                                  </div>
                                </td>
                              );
                            })
                        )}
                        <td className="px-2 py-1.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <ProductProgress
                              activeCount={activeCount}
                              totalCount={totalCount}
                              compact
                            />
                            <ProductActionsMenu
                              productCode={product.product_code}
                              productName={product.product_name || product.product_code}
                              onActivateAll={() => handleActivateAll(product.product_code)}
                              onDeactivateAll={() => handleDeactivateAll(product.product_code)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Matrix Info */}
          {matrix && matrix.matrix_id && (
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Última actualización: {matrix.updated_at ? new Date(matrix.updated_at).toLocaleString() : 'N/A'}
                {matrix.updated_by && ` por ${matrix.updated_by}`}
              </p>
            </div>
          )}
      </div>
    </ConfigLayout>
  );
}
