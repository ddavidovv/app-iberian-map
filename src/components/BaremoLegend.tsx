import React from 'react';
import type { LegendEntry } from '../context/ShippingMapContext';

interface BaremoLegendProps {
  entries: LegendEntry[];
  variant?: 'default' | 'compact';
}

export function BaremoLegend({ entries, variant = 'default' }: BaremoLegendProps) {
  if (!entries.length) {
    return null;
  }

  const itemClass =
    variant === 'compact'
      ? 'grid grid-cols-1 gap-2 text-xs'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 text-sm';

  return (
    <div className={itemClass}>
      {entries.map((entry) => (
        <div key={entry.code} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm ring-1 ring-black/5 flex-shrink-0"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-slate-800">{entry.label}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {entry.code}
              {entry.isAvailable ? '' : ' · No disponible'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
