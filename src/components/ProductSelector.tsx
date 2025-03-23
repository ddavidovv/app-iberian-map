import React from 'react';
import type { ProductMapConfig } from '../types/map';

interface ProductSelectorProps {
  products: ProductMapConfig[];
  selectedProduct: ProductMapConfig | null;
  onSelect: (product: ProductMapConfig) => void;
}

export function ProductSelector({ products, selectedProduct, onSelect }: ProductSelectorProps) {
  return (
    <div>
      <select
        className="w-full px-3 py-1.5 text-sm bg-white/95 backdrop-blur-sm border border-gray-200 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        value={selectedProduct?.id || ''}
        onChange={(e) => {
          const product = products.find(p => p.id === e.target.value);
          if (product) onSelect(product);
        }}
      >
        <option value="">Seleccione un producto</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </div>
  );
}