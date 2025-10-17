import { useState, useCallback, useEffect, useMemo } from 'react';
import { baremoColors } from '../config/baremos';
import { loadMapConfig } from '../services/configService';
import { configManager } from '../services/configManager';
import type { ProductMapConfig, OriginType } from '../types/map';

export function useMapConfig() {
  const [products, setProducts] = useState<ProductMapConfig[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string[]>>({});
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductMapConfig | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const config = await loadMapConfig();
        const availability = await configManager.loadProductsAvailability();
        setProducts(config);
        setProductNames(availability);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load configuration'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  // Filtrar productos disponibles según el origen seleccionado
  const availableProducts = useMemo(() => {
    if (!selectedOrigin) return [];

    const availableNames = productNames[selectedOrigin] || [];

    // Crear productos basados en la lista de disponibilidad
    return availableNames.map(name => {
      // Buscar si el producto existe en la configuración completa
      const existingProduct = products.find(p => p.name === name);

      if (existingProduct) {
        // Producto con configuración completa
        return existingProduct;
      } else {
        // Producto sin configuración (crear mock)
        return {
          id: name.replace(/\s+/g, '_').toUpperCase(),
          name: name,
          origins: [
            {
              origin_type: selectedOrigin,
              mapConfig: []
            }
          ]
        } as ProductMapConfig;
      }
    });
  }, [products, productNames, selectedOrigin]);

  const handleOriginSelect = useCallback((origin: OriginType) => {
    setSelectedOrigin(origin);
    setSelectedProduct(null);
    setSelectedZone('');
  }, []);

  const handleProductSelect = useCallback((product: ProductMapConfig) => {
    setSelectedProduct(product);
    setSelectedZone('');
  }, []);

  const DEFAULT_ZONE_COLOR = '#f1f5f9';

  const getZoneColor = useCallback((zoneId: string): string => {
    if (!selectedProduct || !selectedOrigin || selectedZone === '') return DEFAULT_ZONE_COLOR;

    // Obtener la configuración del origen seleccionado
    const originConfig = selectedProduct.origins.find(o => o.origin_type === selectedOrigin);
    if (!originConfig) return DEFAULT_ZONE_COLOR;

    // Buscar la configuración de la zona de origen seleccionada
    const zoneConfig = originConfig.mapConfig.find(
      (config) => config.origin_zone === selectedZone
    );

    if (!zoneConfig) return baremoColors.find(b => b.code === 'NP')?.color || '#808080';

    // Buscar el baremo correspondiente a la zona de destino
    for (const destin of zoneConfig.destins) {
      if (destin.destin_zones.includes(zoneId)) {
        return baremoColors.find(b => b.code === destin.baremo_code)?.color || '#FFFFFF';
      }
    }

    return baremoColors.find(b => b.code === 'NP')?.color || '#808080';
  }, [selectedProduct, selectedOrigin, selectedZone]);

  return {
    products: availableProducts,
    selectedOrigin,
    selectedProduct,
    selectedZone,
    handleOriginSelect,
    handleProductSelect,
    setSelectedZone,
    getZoneColor,
    isLoading,
    error,
  };
}