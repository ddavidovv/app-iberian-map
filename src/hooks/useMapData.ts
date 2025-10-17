import { useState, useEffect } from 'react';
import type { MapData } from '../types/map';
import { getMapData } from '../services/mapService';

export function useMapData(svgPath?: string) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadMapData() {
      try {
        const data = await getMapData(svgPath);
        setMapData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    loadMapData();
  }, [svgPath]);

  return { mapData, isLoading, error };
}
