import React, { useState, useEffect } from 'react';
import { X, Package, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { shippingTypesServiceV2 } from '../../services/shippingTypesServiceV2';
import type { ShippingType, ShippingTypeCategory } from '../../types/shippingTypes';
import { ProductDragItem } from './ProductDragItem';
import type { RatesModelProduct } from '../../types/ratesModels';

interface ProductsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (products: RatesModelProduct[]) => void;
}

const CATEGORY_LABELS: Record<ShippingTypeCategory, string> = {
  'B2B': 'B2B - Empresas',
  'B2C': 'B2C - Consumidor',
  'DEV/RET': 'Devolución/Retorno',
  'SPORADIC': 'Esporádico',
  'INTER': 'Internacional'
};

const CATEGORY_COLORS: Record<ShippingTypeCategory, { border: string; text: string }> = {
  'B2B': { border: 'border-purple-500', text: 'text-purple-700' },
  'B2C': { border: 'border-blue-500', text: 'text-blue-700' },
  'DEV/RET': { border: 'border-orange-500', text: 'text-orange-700' },
  'SPORADIC': { border: 'border-yellow-500', text: 'text-yellow-700' },
  'INTER': { border: 'border-green-500', text: 'text-green-700' }
};

// Agrupa productos por categoría
function groupByCategory(products: ShippingType[]): Record<ShippingTypeCategory, ShippingType[]> {
  const grouped: Record<ShippingTypeCategory, ShippingType[]> = {
    'B2B': [],
    'B2C': [],
    'DEV/RET': [],
    'SPORADIC': [],
    'INTER': []
  };

  products.forEach(product => {
    grouped[product.category].push(product);
  });

  return grouped;
}

export function ProductsSidebar({ isOpen, onClose, onConfirm }: ProductsSidebarProps) {
  const [products, setProducts] = useState<ShippingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await shippingTypesServiceV2.list();

      // Sort by display_order and then by shipping_type_name
      const sorted = response.shipping_types.sort((a, b) => {
        const orderA = a.display_order ?? 999;
        const orderB = b.display_order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.shipping_type_name.localeCompare(b.shipping_type_name);
      });

      setProducts(sorted);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar productos');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedProducts = groupByCategory(products);

  const handleProductDrop = (productName: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productName)) {
        newSet.delete(productName);
      } else {
        newSet.add(productName);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (onConfirm) {
      const selectedProductsList: RatesModelProduct[] = Array.from(selectedProducts).map(code => {
        const product = products.find(p => p.shipping_type_code === code);
        return {
          product_code: code,
          product_name: product?.display_name || product?.shipping_type_name || code,
          is_available: true,
          is_required: false
        };
      });
      onConfirm(selectedProductsList);
    }
    setSelectedProducts(new Set());
    onClose();
  };

  const handleCancel = () => {
    setSelectedProducts(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[90vh] rounded-2xl border-2 border-gray-300 bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-600 p-2.5">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Añadir Productos al Modelo</h2>
              <p className="text-sm text-gray-600">Selecciona productos haciendo clic en ellos</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-purple-100 hover:text-purple-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-b-2 border-red-200 px-6 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Main Content - 2 columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-6 p-6">
          {/* Left: Available Products by Category */}
          <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 sticky top-0 bg-white pb-2 z-10">
              Productos Disponibles ({products.length})
            </h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                <p className="text-sm font-medium text-gray-500">Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  No hay productos disponibles
                </p>
                <p className="text-xs text-gray-500">
                  Añade productos en el Maestro de Productos
                </p>
              </div>
            ) : (
              <>
                {/* Render each category */}
                {(Object.keys(groupedProducts) as ShippingTypeCategory[]).map((category) => {
                  const categoryProducts = groupedProducts[category];
                  if (categoryProducts.length === 0) return null;

                  return (
                    <div key={category} className="space-y-2">
                      <div className={`flex items-center gap-2 border-l-4 ${CATEGORY_COLORS[category].border} pl-3`}>
                        <h4 className={`text-xs font-bold ${CATEGORY_COLORS[category].text}`}>
                          {CATEGORY_LABELS[category]}
                        </h4>
                        <span className="text-xs text-gray-500">({categoryProducts.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-3">
                        {categoryProducts.map((product) => (
                          <ProductDragItem
                            key={product.shipping_type_code}
                            productName={product.display_name}
                            origin="peninsula"
                            onDrop={() => handleProductDrop(product.shipping_type_code)}
                            isSelected={selectedProducts.has(product.shipping_type_code)}
                            compact={true}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Right: Drop Zone for Selected Products */}
          <div className="flex flex-col border-2 border-dashed border-purple-300 rounded-xl bg-purple-50/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-purple-700">
                Productos Seleccionados
              </h3>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedProducts.size === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="rounded-full bg-purple-100 p-6 mb-4">
                  <Package className="h-12 w-12 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  No hay productos seleccionados
                </p>
                <p className="text-xs text-gray-500 max-w-xs">
                  Haz clic en los productos de la izquierda para añadirlos aquí
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {Array.from(selectedProducts).map((code) => {
                  const product = products.find(p => p.shipping_type_code === code);
                  return (
                    <div
                      key={`selected-${code}`}
                      className="flex items-center justify-between bg-white border-2 border-purple-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {product?.display_name || code}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{code}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleProductDrop(code)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="border-t-2 border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-between">
          <div className="text-xs text-gray-600">
            <p className="font-semibold mb-1">💡 Consejo</p>
            <p>Haz clic en los productos para seleccionarlos. Se añadirán al modelo al confirmar.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedProducts.size === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-bold shadow-lg hover:from-purple-700 hover:to-purple-800 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmar ({selectedProducts.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
