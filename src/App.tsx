import React from 'react';
import { Map } from 'lucide-react';
import { ProductSelector } from './components/ProductSelector';
import { Map as IberianMap } from './components/Map';
import { useMapConfig } from './hooks/useMapConfig';

function App() {
  const {
    products,
    selectedProduct,
    selectedZone,
    handleProductSelect,
    setSelectedZone,
    getZoneColor,
  } = useMapConfig();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-red-900 text-white py-4 px-6 shadow-lg">
        <div className="container mx-auto flex items-center">
          <Map className="w-8 h-8 mr-3" />
          <h1 className="text-2xl font-bold">Mapa Ibérico</h1>
        </div>
      </header>

      <main className="h-[calc(100vh-4rem)] p-4">
        <div className="h-full max-w-[1800px] mx-auto bg-white rounded-lg shadow-lg p-6 relative">
          <div className="h-full flex items-center justify-center bg-gray-50 rounded border border-gray-200">
            <IberianMap
              onZoneClick={setSelectedZone}
              getZoneColor={getZoneColor}
              selectedZone={selectedZone}
              selectedProduct={selectedProduct}
              products={products}
              onProductSelect={handleProductSelect}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
