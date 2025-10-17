import React from 'react';
import { baremoColors } from '../config/baremos';
import type { ProductMapConfig, OriginType } from '../types/map';

interface LegendProps {
  selectedProduct: ProductMapConfig | null;
  selectedOrigin: OriginType | null;
  selectedZone: string;
}

export function Legend({ selectedProduct, selectedOrigin, selectedZone }: LegendProps) {
  // Get unique baremo codes used in the selected product
  const usedBaremoCodes = React.useMemo(() => {
    if (!selectedProduct || !selectedOrigin || !selectedZone) return new Set<string>();

    const codes = new Set<string>();

    // Find the origin configuration
    const originData = selectedProduct.origins.find(o => o.origin_type === selectedOrigin);
    if (!originData) return codes;

    // Find the zone configuration
    const zoneConfig = originData.mapConfig.find(
      config => config.origin_zone === selectedZone
    );

    if (zoneConfig) {
      zoneConfig.destins.forEach(destin => {
        codes.add(destin.baremo_code);
      });
      codes.add('NP');
    }

    return codes;
  }, [selectedProduct, selectedOrigin, selectedZone]);

  const sortedBaremos = React.useMemo(() => {
    return baremoColors
      .filter(baremo => usedBaremoCodes.has(baremo.code))
      .sort((a, b) => {
        if (a.code === 'NP') return 1;
        if (b.code === 'NP') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [usedBaremoCodes]);

  return (
    <div className="h-fit text-sm w-[600px]">
      <div className="grid grid-cols-5 gap-x-6 gap-y-2.5">
        {sortedBaremos.filter(b => b.code !== 'NP').map((baremo) => (
          <div key={baremo.code} className="flex items-center">
            <div
              className="w-3 h-3 rounded-sm mr-2 ring-1 ring-black/5 flex-shrink-0"
              style={{ backgroundColor: baremo.color }}
            />
            <span className="text-gray-700 text-[11px] whitespace-nowrap truncate">{baremo.name}</span>
          </div>
        ))}
        {usedBaremoCodes.has('NP') && (
          <div className="flex items-center opacity-75 col-span-5 border-t border-gray-100/50 pt-2 mt-2">
            <div
              className="w-3 h-3 rounded-sm mr-2 ring-1 ring-black/5 flex-shrink-0"
              style={{ backgroundColor: baremoColors.find(b => b.code === 'NP')?.color }}
            />
            <span className="text-gray-500 text-[11px]">No permitido</span>
          </div>
        )}
      </div>
    </div>
  );
}