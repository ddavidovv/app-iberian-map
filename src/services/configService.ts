import type { ProductMapConfig } from '../types/map';

/**
 * Loads map configuration from JSON file
 * @returns Promise<ProductMapConfig[]>
 */
export async function loadMapConfig(): Promise<ProductMapConfig[]> {
  try {
    const response = await fetch('/src/data/map-config.json');
    if (!response.ok) {
      throw new Error('Failed to load map configuration');
    }
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error loading map configuration:', error);
    throw error;
  }
}