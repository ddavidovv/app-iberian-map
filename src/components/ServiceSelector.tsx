import React, { useMemo, useState } from 'react';
import { PackageOpen, Search, Sparkles } from 'lucide-react';
import type { ServiceOption } from '../context/ShippingMapContext';

interface ServiceSelectorProps {
  services: ServiceOption[];
  selectedCode: string | null;
  onSelect: (serviceCode: string | null) => void;
  className?: string;
}

export function ServiceSelector({
  services,
  selectedCode,
  onSelect,
  className,
}: ServiceSelectorProps) {
  const [query, setQuery] = useState('');

  const filteredServices = useMemo(() => {
    if (!query.trim()) {
      return services;
    }
    const normalized = query.trim().toLowerCase();
    return services.filter((service) => {
      return (
        service.code.toLowerCase().includes(normalized) ||
        service.name.toLowerCase().includes(normalized)
      );
    });
  }, [query, services]);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xl ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
            Productos
          </p>
          <h3 className="text-base font-semibold text-slate-900 leading-tight">
            Selecciona un servicio
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Explora la lista y elige el baremo que quieras visualizar en el mapa.
          </p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Sparkles className="h-4 w-4" />
        </span>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
          />
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto px-3 pb-4">
        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <PackageOpen className="h-8 w-8 text-slate-300" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600">Sin resultados</p>
              <p className="text-xs text-slate-500">
                Ajusta tu búsqueda o limpia el filtro para ver todos los servicios.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredServices.map((service) => {
              const isSelected = service.code === selectedCode;
              return (
                <li key={service.code}>
                  <button
                    type="button"
                    onClick={() => onSelect(service.code)}
                    className={`group w-full rounded-xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50 shadow-inner'
                        : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
                          isSelected
                            ? 'border-red-500 bg-white text-red-600'
                            : 'border-slate-200 bg-slate-50 text-slate-600 group-hover:border-red-200 group-hover:text-red-600'
                        }`}
                      >
                        {service.code}
                      </span>
                      {isSelected ? (
                        <span className="text-[11px] font-medium uppercase text-red-600">
                          Seleccionado
                        </span>
                      ) : (
                        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-300 group-hover:text-red-400">
                          Ver detalle
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-2 text-sm leading-snug ${
                        isSelected ? 'text-red-900' : 'text-slate-700'
                      }`}
                    >
                      {service.name}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
