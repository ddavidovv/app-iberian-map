import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NewMapPage } from './pages/NewMapPage';
import { ProductsConfigPage } from './pages/config/ProductsConfigPage';
import { ModelsConfigPage } from './pages/config/ModelsConfigPage';
import { MapsConfigPage } from './pages/config/MapsConfigPage';
import { ZonesConfigPage } from './pages/config/ZonesConfigPage';
import BaremoGroupsConfigPage from './pages/config/BaremoGroupsConfigPage';
import BaremoMatrixConfigPage from './pages/config/BaremoMatrixConfigPage';
import { ShippingMapProvider } from './context/ShippingMapContext';

// Keep old routes for backward compatibility (optional)
import { MapPage } from './pages/MapPage';
import { AdminPanel } from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <ShippingMapProvider>
        <Routes>
          {/* New Structure */}
          <Route path="/" element={<NewMapPage />} />

          {/* Config Routes */}
          <Route path="/config" element={<Navigate to="/config/products" replace />} />
          <Route path="/config/products" element={<ProductsConfigPage />} />
          <Route path="/config/models" element={<ModelsConfigPage />} />
          <Route path="/config/maps" element={<MapsConfigPage />} />
          <Route path="/config/zones" element={<ZonesConfigPage />} />
          <Route path="/config/baremo-groups" element={<BaremoGroupsConfigPage />} />
          <Route path="/config/baremo-matrix" element={<BaremoMatrixConfigPage />} />

          {/* Legacy routes for backward compatibility - redirect to new structure */}
          <Route path="/old-map" element={<MapPage />} />
          <Route path="/admin" element={<Navigate to="/config/products" replace />} />
          <Route path="/admin/rate-models" element={<Navigate to="/config/models" replace />} />
          <Route path="/zones" element={<Navigate to="/config/zones" replace />} />
          <Route path="/zones-manager" element={<Navigate to="/config/zones" replace />} />
          <Route path="/map-routes" element={<Navigate to="/" replace />} />
          <Route path="/world" element={<Navigate to="/" replace />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ShippingMapProvider>
    </BrowserRouter>
  );
}

export default App;
