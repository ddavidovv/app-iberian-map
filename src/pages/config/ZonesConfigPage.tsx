import React from 'react';
import { ConfigLayout } from '../../components/layout/ConfigLayout';
import { ZonesMaster } from '../../components/admin/ZonesMaster';

export function ZonesConfigPage() {
  return (
    <ConfigLayout>
      <ZonesMaster />
    </ConfigLayout>
  );
}
