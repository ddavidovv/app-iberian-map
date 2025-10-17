import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { TabView } from '../components/TabView';
import { Map as IberianMap } from '../components/Map';
import { ServiceSelector } from '../components/ServiceSelector';
import { MapRoutesPage } from './MapRoutesPage';
import { useShippingMap } from '../context/ShippingMapContext';
import { WorldMapScreen } from './WorldMapPage';

type ViewType = 'map' | 'table';

export function NewMapPage() {
  const {
    services,
    selectedService,
    selectService,
    mapMode,
    isInternational,
    hasOrigin,
    originZone,
    originZoneName,
    selectOrigin,
    getZoneColor,
    isSummaryLoading,
    summaryError,
    legendEntries,
    refreshSummary,
  } = useShippingMap();

  const [activeView, setActiveView] = useState<ViewType>('map');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showWorldPanel, setShowWorldPanel] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const internationalPanelRef = useRef<HTMLDivElement | null>(null);
  const iberianLegendEntries = isInternational ? [] : legendEntries;

  useEffect(() => {
    if (mapMode !== 'iberia' && hasOrigin) {
      setShowWorldPanel(true);
    }
  }, [mapMode, hasOrigin]);

  useEffect(() => {
    if (!isInternational) {
      setShowWorldPanel(false);
    }
  }, [isInternational]);

  useEffect(() => {
    if (isInternational && originZone) {
      setShowWorldPanel(true);
    }
  }, [isInternational, originZone]);

  useEffect(() => {
    if (showWorldPanel) {
      internationalPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showWorldPanel]);

  useEffect(() => {
    if (isInternational && !hasOrigin) {
      setInfoMessage(
        'Selecciona una provincia de origen en el mapa ibérico para ver los destinos internacionales debajo del mapa.',
      );
    } else if (!selectedService) {
      setInfoMessage('Selecciona un servicio y luego marca en el mapa la zona que actuará como origen.');
    } else if (!originZone) {
      setInfoMessage('Haz clic en la zona del mapa que quieras usar como origen.');
    } else {
      setInfoMessage(null);
    }
  }, [isInternational, hasOrigin, selectedService, originZone]);

  // Sidebar content
  const sidebarContent = isPanelCollapsed ? (
    <div className="flex h-[520px] flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-[11px] uppercase tracking-[0.3em] text-gray-400 mx-3">
      <span className="rounded-full bg-red-50 p-3 text-red-900">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="-rotate-90 whitespace-nowrap">Servicios</span>
    </div>
  ) : (
    <div className="space-y-4 px-4">
      <ServiceSelector
        services={services}
        selectedCode={selectedService?.code ?? null}
        onSelect={selectService}
        className="w-full"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow">
        {selectedService ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase text-gray-400 tracking-[0.2em]">
              <span>Servicio activo</span>
              <span>Origen</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-gray-900">{selectedService.code}</p>
                <p className="text-xs text-gray-500 leading-snug">{selectedService.name}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {originZone ? originZoneName || originZone : 'Sin origen seleccionado'}
              </div>
            </div>
          </div>
        ) : (
          <p className="leading-snug">
            Selecciona un servicio para visualizar los baremos disponibles en el mapa.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectService(null)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          Limpiar servicio
        </button>
        <button
          type="button"
          onClick={() => selectOrigin(null)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          Limpiar origen
        </button>
      </div>

      {summaryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 shadow">
          {summaryError}
        </div>
      )}
    </div>
  );

  return (
    <MainLayout
      sidebar={sidebarContent}
      isPanelCollapsed={isPanelCollapsed}
      onTogglePanel={() => setIsPanelCollapsed(!isPanelCollapsed)}
    >
      {/* Tab Navigation */}
      <TabView activeTab={activeView} onTabChange={setActiveView} />

      {/* Content Area */}
      <div className="p-6">
        {activeView === 'map' ? (
          <div className="space-y-6">
            {/* Split View: Show both maps side by side when international + origin */}
            {isInternational && hasOrigin ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Iberian Map */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 relative min-h-[720px]">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa Ibérico</h3>
                  {infoMessage && (
                    <div className="absolute inset-x-6 top-16 z-10 pointer-events-none">
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm pointer-events-auto">
                        {infoMessage}
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex items-center justify-center bg-gray-50 rounded border border-gray-200 h-[620px] sm:h-[660px] transition-all ${
                      infoMessage ? 'mt-16 sm:mt-20' : ''
                    }`}
                  >
                    <IberianMap
                      originZone={originZone}
                      originZoneName={originZoneName}
                      onOriginSelect={selectOrigin}
                      onClearOrigin={() => selectOrigin(null)}
                      getZoneColor={getZoneColor}
                      isSummaryLoading={isSummaryLoading}
                      legendEntries={iberianLegendEntries}
                      showLegend={false}
                      selectedServiceCode={selectedService?.code ?? null}
                      selectedServiceName={selectedService?.name ?? null}
                      onZoneCodeUpdate={refreshSummary}
                    />
                  </div>
                </div>

                {/* Right: International Map */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 relative min-h-[720px]">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa Internacional</h3>
                  <WorldMapScreen variant="embedded" showServiceSelector={false} />
                </div>
              </div>
            ) : (
              <>
                {/* Map View */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 relative min-h-[720px]">
                  {infoMessage && (
                    <div className="absolute inset-x-6 top-6 z-10 pointer-events-none">
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm pointer-events-auto">
                        {infoMessage}
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex items-center justify-center bg-gray-50 rounded border border-gray-200 h-[620px] sm:h-[660px] transition-all ${
                      infoMessage ? 'mt-16 sm:mt-20' : ''
                    }`}
                  >
                    <IberianMap
                      originZone={originZone}
                      originZoneName={originZoneName}
                      onOriginSelect={selectOrigin}
                      onClearOrigin={() => selectOrigin(null)}
                      getZoneColor={getZoneColor}
                      isSummaryLoading={isSummaryLoading}
                      legendEntries={iberianLegendEntries}
                      showLegend={!isInternational}
                      selectedServiceCode={selectedService?.code ?? null}
                      selectedServiceName={selectedService?.name ?? null}
                      onZoneCodeUpdate={refreshSummary}
                    />
                  </div>
                </div>

                {/* International Panel (only in non-split view) */}
                {isInternational && (
                  <section
                    ref={internationalPanelRef}
                    className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Destinos internacionales</h2>
                        <p className="text-sm text-gray-600">
                          {hasOrigin
                            ? 'Consulta los destinos disponibles para el origen seleccionado.'
                            : 'Selecciona un origen en el mapa ibérico para habilitar el resumen internacional.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWorldPanel((prev) => !prev)}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 border transition-colors ${
                          showWorldPanel
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            : 'border-red-900 text-red-900 hover:bg-red-900 hover:text-white'
                        }`}
                      >
                        {showWorldPanel ? 'Ocultar resumen internacional' : 'Ver resumen internacional'}
                      </button>
                    </div>

                    {showWorldPanel && (
                      <WorldMapScreen variant="embedded" showServiceSelector={false} />
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        ) : (
          /* Table View - Integrated MapRoutesPage */
          <MapRoutesPage embedded={true} />
        )}
      </div>
    </MainLayout>
  );
}
