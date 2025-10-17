import React from 'react';
import { ConfigLayout } from '../../components/layout/ConfigLayout';
import { RatesModelsPage } from '../RatesModelsPage';

export function ModelsConfigPage() {
  return (
    <ConfigLayout>
      <div className="-mx-6 -my-6">
        <RatesModelsPage />
      </div>
    </ConfigLayout>
  );
}
