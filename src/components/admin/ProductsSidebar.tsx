import React, { useState, useEffect } from 'react';
import { X, Package, Loader2 } from 'lucide-react';
import { configManager, ProductsAvailability } from '../../services/configManager';
import type { OriginType } from '../../types/map';
import { ProductDragItem } from './ProductDragItem';

interface ProductsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ORIGIN_LABELS: Record<OriginType, string> = {
  peninsula: 'Península',
  canarias: 'Canarias',
  baleares: 'Baleares',
  islas_portugal: 'Islas Portugal'
};

export function ProductsSidebar({ isOpen, onClose }: ProductsSidebarProps) {
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('peninsula');
  const [productsAvailability, setProductsAvailability] = useState<ProductsAvailability>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const config = await configManager.loadProductsAvailability();
      setProductsAvailability(config);
    } catch (error) {
      console.error('Error loading products:', error);
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

  const currentProducts = productsAvailability[selectedOrigin] || [];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-600 p-2.5">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Maestro de Productos</h2>
                <p className="text-xs text-gray-600">Arrastra productos al modelo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-purple-100 hover:text-purple-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Origin Selector */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              Seleccionar Origen
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value as OriginType)}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
            >
              {(Object.keys(ORIGIN_LABELS) as OriginType[]).map((origin) => (
                <option key={origin} value={origin}>
                  {ORIGIN_LABELS[origin]}
                </option>
              ))}
            </select>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                <p className="text-sm font-medium text-gray-500">Cargando productos...</p>
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  No hay productos disponibles
                </p>
                <p className="text-xs text-gray-500">
                  Añade productos en el Maestro de Productos para {ORIGIN_LABELS[selectedOrigin]}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {currentProducts.length} producto{currentProducts.length !== 1 ? 's' : ''} disponible{currentProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {currentProducts.map((product, index) => (
                  <ProductDragItem
                    key={`${selectedOrigin}-${product}-${index}`}
                    productName={product}
                    origin={selectedOrigin}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="border-t border-gray-200 bg-blue-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-600 p-1.5 text-white">
                <Package className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 text-xs text-blue-800">
                <p className="font-semibold mb-1">💡 Consejo</p>
                <p>
                  Arrastra cualquier producto a la tabla del modelo tarifario para añadirlo.
                  Los productos se copian, no se mueven.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
