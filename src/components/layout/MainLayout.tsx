import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, MapIcon } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  isPanelCollapsed: boolean;
  onTogglePanel: () => void;
}

export function MainLayout({ children, sidebar, isPanelCollapsed, onTogglePanel }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Superior */}
      <header className="bg-red-900 text-white py-3 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapIcon className="w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold">Mapa de Tarifas CTT</h1>
              <p className="text-xs text-red-100">Sistema de Visualización de Zonas y Baremos</p>
            </div>
          </div>
          <Link
            to="/config"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex">
        {/* Sidebar Izquierdo */}
        <aside
          className={`relative bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out ${
            isPanelCollapsed ? 'w-16' : 'w-[280px]'
          }`}
        >
          {/* Toggle Button */}
          <button
            type="button"
            onClick={onTogglePanel}
            className="absolute -right-3 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-lg hover:bg-gray-50 hover:border-red-300 hover:text-red-700 transition-colors"
            aria-label={isPanelCollapsed ? 'Expandir panel de servicios' : 'Contraer panel de servicios'}
          >
            {isPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Sidebar Content */}
          <div className="h-full overflow-y-auto py-6">
            {sidebar}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
