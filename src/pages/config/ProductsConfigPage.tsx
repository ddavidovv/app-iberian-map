import React from 'react';
import { ConfigLayout } from '../../components/layout/ConfigLayout';
import { ProductsMaster } from '../../components/config/ProductsMaster';

export function ProductsConfigPage() {
  return (
    <ConfigLayout>
      <ProductsMaster />
    </ConfigLayout>
  );
}
