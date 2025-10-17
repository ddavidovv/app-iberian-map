import React from 'react';
import { Map as MapIcon, Table } from 'lucide-react';

type TabViewType = 'map' | 'table';

interface TabViewProps {
  activeTab: TabViewType;
  onTabChange: (tab: TabViewType) => void;
}

export function TabView({ activeTab, onTabChange }: TabViewProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium text-sm ${
              activeTab === 'map'
                ? 'border-red-900 text-red-900 bg-red-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            Vista de Mapa
          </button>
          <button
            type="button"
            onClick={() => onTabChange('table')}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium text-sm ${
              activeTab === 'table'
                ? 'border-red-900 text-red-900 bg-red-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Table className="w-5 h-5" />
            Vista de Tabla
          </button>
        </div>
      </div>
    </div>
  );
}
