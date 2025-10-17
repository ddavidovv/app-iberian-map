import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map as MapIcon, Settings, Database, Globe2, ChevronLeft, ChevronRight, Sparkles, Columns2, Maximize2 } from 'lucide-react';
import { Map as IberianMap } from '../components/Map';
import { ServiceSelector } from '../components/ServiceSelector';
import { useShippingMap } from '../context/ShippingMapContext';
import { WorldMapScreen } from './WorldMapPage';

export function MapPage() {
  const navigate = useNavigate();
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
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showWorldPanel, setShowWorldPanel] = useState(false);
  const internationalPanelRef = useRef<HTMLDivElement | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [useSplitView, setUseSplitView] = useState(true);
  const iberianLegendEntries = isInternational ? [] : legendEntries;
  // Cambiado: Vista split se muestra solo con isInternational && hasOrigin
  const shouldRenderSplitView = isInternational && hasOrigin;

  // Debug logging
  console.log('[MapPage Render]', {
    isInternational,
    hasOrigin,
    useSplitView,
    showWorldPanel,
    shouldRenderSplitView,
    mapMode,
    selectedService: selectedService?.code,
  });

  // Auto-enable split view when international service with origin is selected
  // and prevent navigation away from MapPage
  useEffect(() => {
    console.log('Split view effect:', { isInternational, hasOrigin, mapMode, useSplitView, showWorldPanel });
    if (isInternational && hasOrigin && mapMode !== 'iberia') {
      console.log('International with origin detected - enabling split view and staying on iberia');
      setUseSplitView(true);
      // Don't let the context navigate us away - we want to show split view
    }
  }, [isInternational, hasOrigin, mapMode, useSplitView, showWorldPanel]);

  useEffect(() => {
    if (mapMode !== 'iberia' && !showWorldPanel) {
      setShowWorldPanel(true);
    }
  }, [mapMode, showWorldPanel]);

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
        'Selecciona una provincia de origen en el mapa iberico para ver los destinos internacionales debajo del mapa.',
      );
    } else if (!selectedService) {
      setInfoMessage('Selecciona un servicio y luego marca en el mapa la zona que actuara como origen.');
    } else if (!originZone) {
      setInfoMessage('Haz clic en la zona del mapa que quieras usar como origen.');
    } else {
      setInfoMessage(null);
    }
  }, [isInternational, hasOrigin, selectedService, originZone]);

  const handleWorldNavigation = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!selectedService) {
      setInfoMessage('Selecciona un servicio antes de abrir el mapa mundial.');
      return;
    }

    if (!isInternational) {
      navigate('/world');
      return;
    }

    if (!hasOrigin) {
      setInfoMessage(
        'Selecciona una provincia de origen en el mapa iberico para ver los destinos internacionales debajo del mapa.',
      );
      return;
    }

    setShowWorldPanel(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-red-900 text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <MapIcon className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">Mapa Iberico</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/zones"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            >
              <Database className="w-4 h-4" />
              Rating zones
            </Link>
            <Link
              to="/zones-manager"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            >
              <Database className="w-4 h-4" />
              Gestion zonas
            </Link>
            <Link
              to="/map-routes"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            >
              <MapIcon className="w-4 h-4" />
              Rutas del mapa
            </Link>
            <Link
              to="/world"
              onClick={handleWorldNavigation}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                isInternational && !hasOrigin
                  ? 'bg-white/5 text-white/70 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Globe2 className="w-4 h-4" />
              Mapa mundial
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              Panel de configuracion
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        <div className="max-w-[1800px] mx-auto flex gap-6 px-6 py-6">
          <div
            className={`relative shrink-0 transition-all duration-300 ease-in-out ${
              isPanelCollapsed ? 'w-[68px]' : 'w-[320px]'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsPanelCollapsed((prev) => !prev)}
              className="absolute -right-3 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg hover:bg-slate-50"
              aria-label={isPanelCollapsed ? 'Expandir panel de servicios' : 'Contraer panel de servicios'}
            >
              {isPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className="sticky top-28">
              {isPanelCollapsed ? (
                <div className="flex h-[520px] flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 text-[11px] uppercase tracking-[0.3em] text-slate-400 shadow-xl">
                  <span className="rounded-full bg-red-50 p-3 text-red-600">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span className="-rotate-90 whitespace-nowrap">Servicios</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <ServiceSelector
                    services={services}
                    selectedCode={selectedService?.code ?? null}
                    onSelect={selectService}
                    className="w-full"
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow">
                    {selectedService ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs uppercase text-slate-400 tracking-[0.2em]">
                          <span>Servicio activo</span>
                          <span>Origen</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{selectedService.code}</p>
                            <p className="text-xs text-slate-500 leading-snug">{selectedService.name}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Limpiar servicio
                    </button>
                    <button
                      type="button"
                      onClick={() => selectOrigin(null)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
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
              )}
            </div>
          </div>

          <div className="flex-1 space-y-6 pb-8">
            <div className="bg-yellow-100 border border-yellow-400 p-4 mb-4 text-sm">
              DEBUG: isInternational={String(isInternational)}, hasOrigin={String(hasOrigin)},
              showing split view: {String(shouldRenderSplitView)}
            </div>
            {shouldRenderSplitView ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 relative min-h-[720px]">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUseSplitView(false)}
                      className="p-2 bg-white/90 rounded-full shadow-md border border-slate-200 hover:bg-slate-100 transition-colors"
                      title="Vista internacional completa"
                    >
                      <Maximize2 className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  {infoMessage && (
                    <div className="absolute inset-x-6 top-16 z-10 pointer-events-none">
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm pointer-events-auto">
                        {infoMessage}
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Mapa Ibérico</h3>
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

                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 relative min-h-[720px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Mapa Internacional</h3>
                  </div>
                  <WorldMapScreen variant="embedded" showServiceSelector={false} />
                </div>
              </div>
            ) : (
              <>
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

                {isInternational && (
                  <section
                    ref={internationalPanelRef}
                    className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Destinos internacionales</h2>
                        <p className="text-sm text-slate-600">
                          {hasOrigin
                            ? 'Consulta los destinos disponibles para el origen seleccionado.'
                            : 'Selecciona un origen en el mapa iberico para habilitar el resumen internacional.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hasOrigin && (
                          <button
                            type="button"
                            onClick={() => setUseSplitView(true)}
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Columns2 className="w-4 h-4" />
                            Vista dividida
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowWorldPanel((prev) => !prev)}
                          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 border transition-colors ${
                            showWorldPanel
                              ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'border-red-900 text-red-900 hover:bg-red-900 hover:text-white'
                          }`}
                        >
                          <Globe2 className="w-4 h-4" />
                          {showWorldPanel ? 'Ocultar resumen internacional' : 'Ver resumen internacional'}
                        </button>
                        <Link
                          to="/world"
                          onClick={handleWorldNavigation}
                          className="inline-flex items-center gap-2 rounded-md px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Abrir en pantalla completa
                        </Link>
                      </div>
                    </div>

                    {showWorldPanel && (
                      <WorldMapScreen variant="embedded" showServiceSelector={false} />
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
