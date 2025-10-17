import React from 'react';
import type { OriginType } from '../types/map';

interface OriginSelectorProps {
  selectedOrigin: OriginType | null;
  onSelect: (origin: OriginType) => void;
}

const ORIGIN_LABELS: Record<OriginType, string> = {
  peninsula: 'Península',
  canarias: 'Canarias',
  baleares: 'Baleares',
  islas_portugal: 'Islas Portugal'
};

export function OriginSelector({ selectedOrigin, onSelect }: OriginSelectorProps) {
  const origins: OriginType[] = ['peninsula', 'canarias', 'baleares', 'islas_portugal'];

  return (
    <div>
      <select
        className="w-full px-3 py-1.5 text-sm bg-white/95 backdrop-blur-sm border border-gray-200 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        value={selectedOrigin || ''}
        onChange={(e) => {
          const origin = e.target.value as OriginType;
          if (origin) onSelect(origin);
        }}
      >
        <option value="">Seleccione origen del cliente</option>
        {origins.map((origin) => (
          <option key={origin} value={origin}>
            {ORIGIN_LABELS[origin]}
          </option>
        ))}
      </select>
    </div>
  );
}
