import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Package, Layers, Map as MapIconLucide, MapPin, Grid3x3, TableProperties } from 'lucide-react';

interface ConfigLayoutProps {
  children: React.ReactNode;
}

const MENU_ITEMS = [
  {
    id: 'products',
    path: '/config/products',
    label: '1. Maestro de Productos',
    icon: Package,
    description: 'Crear y gestionar productos'
  },
  {
    id: 'models',
    path: '/config/models',
    label: '2. Modelos Tarifarios',
    icon: Layers,
    description: 'Vinculación de productos'
  },
  {
    id: 'baremo-groups',
    path: '/config/baremo-groups',
    label: '2.1. Grupos de Baremos',
    icon: Grid3x3,
    description: 'Catálogo de baremos'
  },
  {
    id: 'baremo-matrix',
    path: '/config/baremo-matrix',
    label: '2.2. Matriz de Baremos',
    icon: TableProperties,
    description: 'Configurar disponibilidad'
  },
  {
    id: 'maps',
    path: '/config/maps',
    label: '3. Maestro de Mapas',
    icon: MapIconLucide,
    description: 'Configurar mapas SVG'
  },
  {
    id: 'zones',
    path: '/config/zones',
    label: '4. Maestro de Zonas',
    icon: MapPin,
    description: 'Gestión de zonas generales'
  }
];

export function ConfigLayout({ children }: ConfigLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-red-900 text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold">Panel de Configuración</h1>
              <p className="text-xs text-red-100">Administración de productos, modelos y zonas</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Mapa
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar Navigation */}
        <aside className="w-[280px] bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Configuración
            </h2>
            <nav className="space-y-1">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-red-700' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isActive ? 'text-red-900' : 'text-gray-900'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Info Box */}
          <div className="p-4 border-t border-gray-200 mt-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="font-semibold text-blue-900 text-xs mb-1">Orden de configuración</h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Sigue el orden numérico para una configuración correcta del sistema
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
