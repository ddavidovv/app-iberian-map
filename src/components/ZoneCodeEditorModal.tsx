import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchRatingZones, updateRouteZoneCode } from '../services/mapApiService';

interface ZoneCodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  originZoneCode: string;
  originZoneName: string | null;
  destinZoneCode: string;
  destinZoneName: string | null;
  shippingTypeCode: string;
  shippingTypeName: string;
  currentZoneCode: string;
  onSuccess: () => void;
}

export function ZoneCodeEditorModal({
  isOpen,
  onClose,
  originZoneCode,
  originZoneName,
  destinZoneCode,
  destinZoneName,
  shippingTypeCode,
  shippingTypeName,
  currentZoneCode,
  onSuccess,
}: ZoneCodeEditorModalProps) {
  const [newZoneCode, setNewZoneCode] = useState(currentZoneCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [baremoOptions, setBaremoOptions] = useState<Array<{ code: string; label: string }>>(
    []
  );
  const hasRequestedOptions = useRef(false);

  useEffect(() => {
    setNewZoneCode(currentZoneCode);
  }, [currentZoneCode]);

  const loadBaremoOptions = useCallback(
    async (force = false) => {
      if (force) {
        hasRequestedOptions.current = false;
      }

      if (hasRequestedOptions.current) {
        return;
      }

      hasRequestedOptions.current = true;
      setIsOptionsLoading(true);
      setOptionsError(null);

      try {
        const zones = await fetchRatingZones();
        const unique = new Map<string, { code: string; label: string }>();

        zones.forEach((zone) => {
          const code = zone.rating_zone_code;
          if (!code || unique.has(code)) {
            return;
          }
          const name = zone.rating_zone_name;
          const help = zone.rating_zone_help;
          const label = name ? `${code} - ${name}` : help ? `${code} - ${help}` : code;
          unique.set(code, { code, label });
        });

        const options = Array.from(unique.values()).sort((a, b) =>
          a.code.localeCompare(b.code)
        );

        setBaremoOptions(options);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'No se pudieron cargar los baremos';
        setOptionsError(message);
        if (force) {
          hasRequestedOptions.current = false;
        }
      } finally {
        setIsOptionsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    loadBaremoOptions();
  }, [isOpen, loadBaremoOptions]);

  const availableOptions = useMemo(() => {
    const options = [...baremoOptions];
    if (currentZoneCode && !options.some((option) => option.code === currentZoneCode)) {
      options.unshift({
        code: currentZoneCode,
        label: `${currentZoneCode} - Actual`,
      });
    }
    return options;
  }, [baremoOptions, currentZoneCode]);

  const handleReloadOptions = () => {
    loadBaremoOptions(true);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newZoneCode === currentZoneCode) {
      setError('El nuevo código de baremo es igual al actual');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await updateRouteZoneCode({
        originZoneCode,
        destinZoneCode,
        shippingTypeCode,
        newZoneCode,
        updatedBy: 'Frontend User',
      });

      setSuccessMessage(response.message);

      // Wait a moment to show success message before closing
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al actualizar el código de zona'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNewZoneCode(currentZoneCode);
      setError(null);
      setSuccessMessage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Editar Baremo de Ruta
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Route Info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Origen:</span>
                <p className="text-gray-900">
                  {originZoneName || originZoneCode}
                </p>
                <p className="text-xs text-gray-500">{originZoneCode}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Destino:</span>
                <p className="text-gray-900">
                  {destinZoneName || destinZoneCode}
                </p>
                <p className="text-xs text-gray-500">{destinZoneCode}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-700 text-sm">Servicio:</span>
              <p className="text-gray-900">
                {shippingTypeName} ({shippingTypeCode})
              </p>
            </div>
          </div>

          {/* Current Zone Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Baremo actual
            </label>
            <div className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700">
              {currentZoneCode}
            </div>
          </div>

          {/* New Zone Code Selection */}
          <div>
            <label htmlFor="new-zone-code" className="block text-sm font-medium text-gray-700 mb-1">
              Nuevo baremo
            </label>
            {isOptionsLoading && availableOptions.length === 0 && (
              <p className="mb-2 text-xs text-gray-500">Cargando catálogo de baremos...</p>
            )}
            <select
              id="new-zone-code"
              value={newZoneCode}
              onChange={(e) => setNewZoneCode(e.target.value)}
              disabled={isLoading || (isOptionsLoading && availableOptions.length === 0) || availableOptions.length === 0}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {availableOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            {availableOptions.length === 0 && !isOptionsLoading && (
              <p className="mt-1 text-xs text-gray-500">
                No se encontraron baremos disponibles.
              </p>
            )}
            {optionsError && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-red-600">{optionsError}</span>
                <button
                  type="button"
                  onClick={handleReloadOptions}
                  className="text-xs font-medium text-red-700 hover:text-red-800"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                newZoneCode === currentZoneCode ||
                availableOptions.length === 0
              }
              className="flex items-center gap-2 rounded-md bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
