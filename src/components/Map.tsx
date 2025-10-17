import React, { useCallback } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { MapZone } from './MapZone';
import { useMapData } from '../hooks/useMapData';
import type { LegendEntry } from '../context/ShippingMapContext';
import { DraggableLegend } from './DraggableLegend';
import { ZoneCodeEditorModal } from './ZoneCodeEditorModal';

interface MapProps {
  originZone: string | null;
  originZoneName: string | null;
  onOriginSelect: (zoneId: string, zoneName?: string | null) => void;
  onClearOrigin: () => void;
  getZoneColor: (zoneId: string) => string;
  isSummaryLoading: boolean;
  legendEntries: LegendEntry[];
  showLegend?: boolean;
  selectedServiceCode?: string | null;
  selectedServiceName?: string | null;
  onZoneCodeUpdate?: () => void;
}

export function Map({
  originZone,
  originZoneName,
  onOriginSelect,
  onClearOrigin,
  getZoneColor,
  isSummaryLoading,
  legendEntries,
  showLegend = true,
  selectedServiceCode,
  selectedServiceName,
  onZoneCodeUpdate,
}: MapProps) {
  const { mapData, isLoading, error } = useMapData();
  const [scale, setScale] = React.useState(0.85);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalZoneId, setModalZoneId] = React.useState<string | null>(null);
  const [modalZoneName, setModalZoneName] = React.useState<string | null>(null);
  const [currentZoneCode, setCurrentZoneCode] = React.useState<string>('');
  
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking the SVG background, not a zone
    if (e.target === e.currentTarget) {
      onClearOrigin();
    }
  }, [onClearOrigin]);

  const handleZoneClick = useCallback(
    (zoneId: string, zoneName?: string | null) => {
      onOriginSelect(zoneId, zoneName);
    },
    [onOriginSelect],
  );

  const handleZoneContextMenu = useCallback(
    (e: React.MouseEvent, zoneId: string, zoneName?: string | null) => {
      e.preventDefault();

      // Only allow editing if origin and service are selected
      if (!originZone || !selectedServiceCode) {
        return;
      }

      // Don't allow editing the origin zone itself
      if (zoneId === originZone) {
        return;
      }

      // Get the current zone color to determine the baremo code
      const color = getZoneColor(zoneId);

      // Find the baremo code from the legend entries
      const legendEntry = legendEntries.find(entry => entry.color === color);
      const baremoCode = legendEntry?.code || 'NP';

      setModalZoneId(zoneId);
      setModalZoneName(zoneName || null);
      setCurrentZoneCode(baremoCode);
      setIsModalOpen(true);
    },
    [originZone, selectedServiceCode, getZoneColor, legendEntries],
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalZoneId(null);
    setModalZoneName(null);
    setCurrentZoneCode('');
  }, []);

  const handleModalSuccess = useCallback(() => {
    if (onZoneCodeUpdate) {
      onZoneCodeUpdate();
    }
  }, [onZoneCodeUpdate]);

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
    <div className="relative h-full" ref={containerRef}>
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

      <svg
        ref={svgRef}
        viewBox={mapData.viewBox}
        className={`w-full transform-gpu ${isFullscreen ? 'h-screen' : 'h-full'}`}
        onClick={handleBackgroundClick}
        preserveAspectRatio="xMidYMid meet"
        style={{ backgroundColor: '#ffffff' }}
      >
        {mapData.defs ? <defs dangerouslySetInnerHTML={{ __html: mapData.defs }} /> : null}
        <g transform={`scale(${scale}) translate(0, ${isFullscreen ? 40 : 20})`}>
          {originZone && (
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
                {originZoneName || mapData.zones.find(z => z.id === originZone)?.name || originZone}
              </text>
              <text
                x="60%"
                y="24"
                className="text-[10px] fill-gray-500 text-center"
                textAnchor="middle"
              >
                ({originZone})
              </text>
            </g>
          )}
          <g>
            {/* Special square zones */}
            {mapData.zones
              .filter((zone) => zone.id.startsWith('cuadrado_'))
              .map((zone, index) => (
                <MapZone
                  key={`${zone.id}-${index}`}
                  {...zone}
                  color="#f1f5f9"
                  isSelected={false}
                  onClick={() => {}}
                />
              ))}
            {/* Regular zones */}
            {mapData.zones.map((zone, index) => {
              if (zone.id.startsWith('cuadrado_')) return null;
              const zoneKey = zone.zoneCode ?? zone.id;
              const reactKey = `${zoneKey}-${zone.id}-${index}`;
              return (
                <MapZone
                  key={reactKey}
                  {...zone}
                  color={getZoneColor(zoneKey)}
                  isSelected={originZone === zoneKey}
                  onClick={() =>
                    handleZoneClick(zoneKey, zone.name ?? zoneKey)
                  }
                  onContextMenu={(e) =>
                    handleZoneContextMenu(e, zoneKey, zone.name ?? zoneKey)
                  }
                />
              );
            })}
          </g>
        </g>
     </svg>

      {isSummaryLoading && originZone && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-700" />
            Calculando baremos para la ruta seleccionada...
          </div>
        </div>
      )}

      {showLegend && legendEntries.length > 0 ? (
        <DraggableLegend
          entries={legendEntries}
          containerRef={containerRef}
          anchor="bottom-right"
        />
      ) : null}

      {isModalOpen && originZone && modalZoneId && selectedServiceCode && (
        <ZoneCodeEditorModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          originZoneCode={originZone}
          originZoneName={originZoneName}
          destinZoneCode={modalZoneId}
          destinZoneName={modalZoneName}
          shippingTypeCode={selectedServiceCode}
          shippingTypeName={selectedServiceName || selectedServiceCode}
          currentZoneCode={currentZoneCode}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
