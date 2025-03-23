import { useState, useCallback, useEffect } from 'react';
import { baremoColors } from '../config/baremos';
import { loadMapConfig } from '../services/configService';
import type { ProductMapConfig } from '../types/map';

export function useMapConfig() {
  const [products, setProducts] = useState<ProductMapConfig[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductMapConfig | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const config = await loadMapConfig();
        setProducts(config);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load configuration'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  const handleProductSelect = useCallback((product: ProductMapConfig) => {
    setSelectedProduct(product);
    setSelectedZone('');
  }, []);

  const DEFAULT_ZONE_COLOR = '#f1f5f9';

  const getZoneColor = useCallback((zoneId: string): string => {
    if (!selectedProduct || selectedZone === '') return DEFAULT_ZONE_COLOR;

    const originConfig = selectedProduct.mapConfig.find(
      (config) => config.origin_zone === selectedZone
    );

    if (!originConfig) return baremoColors.find(b => b.code === 'NP')?.color || '#808080';

    for (const destin of originConfig.destins) {
      if (destin.destin_zones.includes(zoneId)) {
        return baremoColors.find(b => b.code === destin.baremo_code)?.color || '#FFFFFF';
      }
    }

    return baremoColors.find(b => b.code === 'NP')?.color || '#808080';
  }, [selectedProduct, selectedZone]);

  return {
    products,
    selectedProduct,
    selectedZone,
    handleProductSelect,
    setSelectedZone,
    getZoneColor,
    isLoading,
    error,
  };
}