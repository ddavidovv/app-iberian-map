import mapConfigData from '../data/map-config.json';
import type { ProductMapConfig } from '../types/map';

// Type assertion since we know the structure matches ProductMapConfig[]
export const products: ProductMapConfig[] = mapConfigData.products;