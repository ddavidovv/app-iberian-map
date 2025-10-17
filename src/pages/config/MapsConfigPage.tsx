import React from 'react';
import { ConfigLayout } from '../../components/layout/ConfigLayout';
import { MapsMaster } from '../../components/config/MapsMaster';

export function MapsConfigPage() {
  return (
    <ConfigLayout>
      <MapsMaster />
    </ConfigLayout>
  );
}
