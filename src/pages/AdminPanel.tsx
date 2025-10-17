import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft, Layers } from 'lucide-react';
import { ProductsManager } from '../components/admin/ProductsManager';
import { ZoneGroupsManager } from '../components/admin/ZoneGroupsManager';
import { ZonesMaster } from '../components/admin/ZonesMaster';

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'zones' | 'mappings' | 'regional' | 'master'>('products');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password protection (in production, use proper authentication)
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Settings className="w-12 h-12 text-red-900" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6">Panel de Administración</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ingrese la contraseña"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-900 text-white py-2 rounded-md hover:bg-red-800 transition-colors"
            >
              Ingresar
            </button>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Contraseña por defecto: admin123
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-900 text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">Panel de Configuración</h1>
          </div>
          <Link
            to="/admin/rate-models"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            <Layers className="w-4 h-4" />
            Modelos Tarifarios
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Mapa
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-red-900 text-red-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveTab('zones')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'zones'
                    ? 'border-red-900 text-red-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Grupos de Zonas
              </button>
              <button
                onClick={() => setActiveTab('mappings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'mappings'
                    ? 'border-red-900 text-red-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mapeos de Categorías
              </button>
              <button
                onClick={() => setActiveTab('regional')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'regional'
                    ? 'border-red-900 text-red-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Configuración Regional
              </button>
              <button
                onClick={() => setActiveTab('master')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'master'
                    ? 'border-red-900 text-red-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Maestro de Zonas
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'products' && <ProductsManager />}
            {activeTab === 'zones' && <ZoneGroupsManager />}
            {activeTab === 'mappings' && (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">Editor de Mapeos de Categorías</p>
                <p className="text-sm">Próximamente disponible</p>
              </div>
            )}
            {activeTab === 'regional' && (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">Configuración de Regiones</p>
                <p className="text-sm">Próximamente disponible</p>
              </div>
            )}
            {activeTab === 'master' && <ZonesMaster />}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Información</h3>
          <p className="text-sm text-blue-800">
            Use este panel para configurar los productos disponibles por origen, grupos de zonas,
            mapeos de categorías y configuración regional. Los cambios se guardan automáticamente
            en el navegador.
          </p>
        </div>
      </div>
    </div>
  );
}
