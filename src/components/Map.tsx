import React, { useCallback } from 'react';
import { Maximize2, ZoomIn, ZoomOut, List, X } from 'lucide-react';
import { MapZone } from './MapZone';
import { ProductSelector } from './ProductSelector';
import { useMapData } from '../hooks/useMapData';
import { DraggableLegend } from './DraggableLegend';
import type { ProductMapConfig } from '../types/map';

interface MapProps {
  onZoneClick: (zoneId: string) => void;
  getZoneColor: (zoneId: string) => string;
  selectedZone: string;
  selectedProduct: ProductMapConfig | null;
  products: ProductMapConfig[];
  onProductSelect: (product: ProductMapConfig) => void;
}

export function Map({ onZoneClick, getZoneColor, selectedZone, selectedProduct, products, onProductSelect }: MapProps) {
  const { mapData, isLoading, error } = useMapData();
  const [scale, setScale] = React.useState(0.85);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);
  
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking the SVG background, not a zone
    if (e.target === e.currentTarget) {
      onZoneClick('');
    }
  }, [onZoneClick]);

  const handleZoneClick = useCallback((zoneId: string) => {
    onZoneClick(zoneId);
  }, [onZoneClick]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 1.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      svgRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900" />
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-600">
        Error loading map data
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={handleZoomOut}
          className="p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50"
          title="Reducir"
        >
          <ZoomOut className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50"
          title="Ampliar"
        >
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-50"
          title="Pantalla completa"
        >
          <Maximize2 className="w-4 h-4 text-gray-600" />
        </button>        
      </div>
      
      <div className="absolute top-2 left-2 z-10 w-64">
        <ProductSelector
          products={products}
          selectedProduct={selectedProduct}
          onSelect={onProductSelect}
        />
      </div>
      
      <svg
        ref={svgRef}
        viewBox={mapData.viewBox}
        className={`w-full transform-gpu ${isFullscreen ? 'h-screen' : 'h-full'}`}
        onClick={handleBackgroundClick}
        preserveAspectRatio="xMidYMid meet"
        style={{ backgroundColor: '#ffffff' }}
      >
        <g transform={`scale(${scale}) translate(0, ${isFullscreen ? 40 : 20})`}>
          {selectedZone && (
            <g>
              <rect
                x="60%"
                y="0"
                width="240"
                height="28"
                fill="white"
                fillOpacity="0.95"
                rx="6"
                transform="translate(-120, 0)"
                filter="drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))"
              />
              <text 
                x="60%"
                y="12"
                className="text-sm fill-gray-800 font-semibold text-center"
                textAnchor="middle"
              >
                {mapData.zones.find(z => z.id === selectedZone)?.name || selectedZone}
              </text>
              <text
                x="60%"
                y="24"
                className="text-[10px] fill-gray-500 text-center"
                textAnchor="middle"
              >
                ({selectedZone})
              </text>
            </g>
          )}
          <g>
            {/* Special square zones */}
            {mapData.zones
              .filter(zone => zone.id.startsWith('cuadrado_'))
              .map((zone) => (
                <MapZone
                  key={zone.id}
                  {...zone}
                  color="#f1f5f9"
                  isSelected={false}
                  onClick={() => {}}
                />
              ))}
            {/* Regular zones */}
            {mapData.zones.map((zone) => (
              !zone.id.startsWith('cuadrado_') && (
              <MapZone
                key={zone.id}
                {...zone}
                color={getZoneColor(zone.id)}
                isSelected={selectedZone === zone.id}
                onClick={() => handleZoneClick(zone.id)}
              />
              )
            ))}
          </g>
        </g>
      </svg>
      
      {selectedProduct && selectedZone && (
        <DraggableLegend
          selectedProduct={selectedProduct}
          selectedZone={selectedZone}
        />
      )}
    </div>
  );
}