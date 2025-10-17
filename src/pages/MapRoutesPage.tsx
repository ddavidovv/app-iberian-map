import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Filter, Download } from 'lucide-react';
import { HierarchicalFilters } from '../components/HierarchicalFilters';
import * as XLSX from 'xlsx';

interface Route {
  _id: string;
  origin_zone_code: string;
  origin_zone_name: string;
  destin_zone_code: string;
  destin_zone_name: string;
  group_zone_origin: string;
  group_zone_destin: string;
  services: {
    [key: string]: string;
  };
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface FilterZone {
  zone_code: string;
  zone_name: string;
  country?: string;
  group?: string;
}

interface Filters {
  origin_zones: FilterZone[];
  destin_zones: FilterZone[];
  origin_groups: string[];
  destin_groups: string[];
  services: { code: string; name: string }[];
}

const API_URL = 'http://localhost:8080/map';

const SERVICE_COLORS: { [key: string]: string } = {
  available: 'bg-green-100 text-green-800 border-green-300',
  unavailable: 'bg-gray-100 text-gray-500 border-gray-300',
};

const formatNumber = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '-';
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return Number.isInteger(numericValue) ? numericValue.toString() : numericValue.toFixed(2);
};

// Get 2-character abbreviation from service name
const getServiceAbbreviation = (serviceName: string): string => {
  // Extract meaningful parts from service name
  const words = serviceName.split(/[\s-]+/);

  // Try to get first 2 characters from meaningful words
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  // If only one word, take first 2 characters
  return serviceName.substring(0, 2).toUpperCase();
};

interface MapRoutesPageProps {
  embedded?: boolean;
}

export const MapRoutesPage: React.FC<MapRoutesPageProps> = ({ embedded = false }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [filters, setFilters] = useState<Filters>({
    origin_zones: [],
    destin_zones: [],
    origin_groups: [],
    destin_groups: [],
    services: [],
  });
  const [pageInput, setPageInput] = useState('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);

  // Filter states - Hierarchical (País -> Grupo -> Zona)
  const [selectedOriginCountry, setSelectedOriginCountry] = useState('');
  const [selectedOriginGroup, setSelectedOriginGroup] = useState('');
  const [selectedOriginZone, setSelectedOriginZone] = useState('');
  const [selectedDestinCountry, setSelectedDestinCountry] = useState('');
  const [selectedDestinGroup, setSelectedDestinGroup] = useState('');
  const [selectedDestinZone, setSelectedDestinZone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    setPageInput(pagination.page.toString());
  }, [pagination.page]);

  const fetchFilters = async () => {
    try {
      const response = await fetch(`${API_URL}/filters`);
      if (!response.ok) throw new Error('Error loading filters');
      const data = await response.json();
      setFilters(data);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        page_size: pagination.page_size.toString(),
      });

      // Only add zone filters if zones are explicitly selected
      if (selectedOriginZone) params.append('origin_zone_code', selectedOriginZone);
      if (selectedDestinZone) params.append('destin_zone_code', selectedDestinZone);

      // Only add group filters if groups are explicitly selected AND no zone is selected
      if (selectedOriginGroup && !selectedOriginZone) {
        params.append('group_zone_origin', selectedOriginGroup);
      }
      if (selectedDestinGroup && !selectedDestinZone) {
        params.append('group_zone_destin', selectedDestinGroup);
      }

      // Add country filters if countries are selected AND no group/zone is selected
      if (selectedOriginCountry && !selectedOriginGroup && !selectedOriginZone) {
        params.append('country_zone_origin', selectedOriginCountry);
      }
      if (selectedDestinCountry && !selectedDestinGroup && !selectedDestinZone) {
        params.append('country_zone_destin', selectedDestinCountry);
      }

      if (selectedService) params.append('service', selectedService);
      if (availableOnly) params.append('available_only', 'true');

      // Add search term if it exists
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${API_URL}/routes?${params}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      setRoutes(data.routes);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading routes');
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.page_size,
    selectedOriginCountry,
    selectedOriginZone,
    selectedDestinCountry,
    selectedDestinZone,
    selectedOriginGroup,
    selectedDestinGroup,
    selectedService,
    availableOnly,
    searchTerm,
  ]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handlePageJump = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetPage = Number(pageInput);
    if (
      Number.isNaN(targetPage) ||
      !Number.isInteger(targetPage) ||
      targetPage < 1 ||
      targetPage > pagination.total_pages
    ) {
      setPageInput(pagination.page.toString());
      return;
    }

    if (targetPage !== pagination.page) {
      handlePageChange(targetPage);
    }
  };

  const toggleRow = (routeId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId);
    } else {
      newExpanded.add(routeId);
    }
    setExpandedRows(newExpanded);
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleClearFilters = () => {
    setSelectedOriginCountry('');
    setSelectedOriginGroup('');
    setSelectedOriginZone('');
    setSelectedDestinCountry('');
    setSelectedDestinGroup('');
    setSelectedDestinZone('');
    setSelectedService('');
    setAvailableOnly(false);
    setSearchTerm('');
    setPagination({ ...pagination, page: 1 });
  };

  const exportToExcel = async () => {
    try {
      const allRoutes: Route[] = [];
      const pageSize = 5000; // Fetch in batches of 5000 (backend maximum)
      const totalPages = Math.ceil(pagination.total / pageSize);

      // Show progress to user
      console.log(`Exportando ${pagination.total} rutas en ${totalPages} lotes...`);

      // Fetch all routes in batches
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString(),
        });

        // Add all active filters
        if (selectedOriginZone) params.append('origin_zone_code', selectedOriginZone);
        if (selectedDestinZone) params.append('destin_zone_code', selectedDestinZone);
        if (selectedOriginGroup && !selectedOriginZone) {
          params.append('group_zone_origin', selectedOriginGroup);
        }
        if (selectedDestinGroup && !selectedDestinZone) {
          params.append('group_zone_destin', selectedDestinGroup);
        }
        if (selectedOriginCountry && !selectedOriginGroup && !selectedOriginZone) {
          params.append('country_zone_origin', selectedOriginCountry);
        }
        if (selectedDestinCountry && !selectedDestinGroup && !selectedDestinZone) {
          params.append('country_zone_destin', selectedDestinCountry);
        }
        if (selectedService) params.append('service', selectedService);
        if (availableOnly) params.append('available_only', 'true');
        if (searchTerm) params.append('search', searchTerm);

        const response = await fetch(`${API_URL}/routes?${params}`);
        if (!response.ok) {
          throw new Error(`Error fetching page ${currentPage}: ${response.status}`);
        }

        const data = await response.json();
        allRoutes.push(...data.routes);

        // Log progress after each batch
        console.log(`Lote ${currentPage}/${totalPages}: Descargadas ${allRoutes.length} de ${pagination.total} rutas...`);
      }

      console.log(`✓ Exportación completada: ${allRoutes.length} rutas descargadas. Generando Excel...`);

      // Prepare data for Excel
      const headers = [
        'Código Origen',
        'Nombre Origen',
        'Grupo Origen',
        'Código Destino',
        'Nombre Destino',
        'Grupo Destino',
        ...filters.services.map((s) => s.name),
      ];

      const rows = allRoutes.map((route) => [
        route.origin_zone_code,
        route.origin_zone_name,
        route.group_zone_origin || '',
        route.destin_zone_code,
        route.destin_zone_name,
        route.group_zone_destin || '',
        ...filters.services.map((s) => route.services[s.code] || 'NP'),
      ]);

      // Create worksheet
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Código Origen
        { wch: 30 }, // Nombre Origen
        { wch: 15 }, // Grupo Origen
        { wch: 15 }, // Código Destino
        { wch: 30 }, // Nombre Destino
        { wch: 15 }, // Grupo Destino
        ...filters.services.map(() => ({ wch: 12 })), // Services
      ];
      ws['!cols'] = colWidths;

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rutas');

      // Generate Excel file and trigger download
      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `rutas-mapa-${timestamp}.xlsx`);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Error al exportar a Excel. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-100'}>
      <div className={embedded ? '' : 'container mx-auto px-4 py-8'}>
        {/* Header */}
        {!embedded && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft size={20} />
                Volver al Mapa
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">Rutas del Mapa</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter size={20} />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Exportar Excel
              </button>
            </div>
          </div>
        )}

        {/* Embedded Header */}
        {embedded && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium"
              >
                <Filter size={18} />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download size={18} />
                Exportar Excel
              </button>
            </div>
          </div>
        )}

        {/* Hierarchical Filters Panel */}
        {showFilters && (
          <HierarchicalFilters
            originZones={filters.origin_zones}
            destinZones={filters.destin_zones}
            originGroups={filters.origin_groups}
            destinGroups={filters.destin_groups}
            services={filters.services}
            selectedOriginCountry={selectedOriginCountry}
            selectedOriginGroup={selectedOriginGroup}
            selectedOriginZone={selectedOriginZone}
            selectedDestinCountry={selectedDestinCountry}
            selectedDestinGroup={selectedDestinGroup}
            selectedDestinZone={selectedDestinZone}
            selectedService={selectedService}
            availableOnly={availableOnly}
            searchTerm={searchTerm}
            onOriginCountryChange={(value) => {
              setSelectedOriginCountry(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onOriginGroupChange={(value) => {
              setSelectedOriginGroup(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onOriginZoneChange={(value) => {
              setSelectedOriginZone(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onDestinCountryChange={(value) => {
              setSelectedDestinCountry(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onDestinGroupChange={(value) => {
              setSelectedDestinGroup(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onDestinZoneChange={(value) => {
              setSelectedDestinZone(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onServiceChange={(value) => {
              setSelectedService(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onAvailableOnlyChange={(value) => {
              setAvailableOnly(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onSearchTermChange={(value) => {
              setSearchTerm(value);
              setPagination({ ...pagination, page: 1 });
            }}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando rutas...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error al cargar las rutas</p>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchRoutes}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Routes Table */}
        {!loading && !error && (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando {routes.length} rutas (Página {pagination.page} de{' '}
                  {pagination.total_pages}) - Total: {pagination.total}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Origen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destino
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grupo Origen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grupo Destino
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Servicios
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {routes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No se encontraron rutas
                        </td>
                      </tr>
                    ) : (
                      routes.map((route) => {
                        const isExpanded = expandedRows.has(route._id);
                        const availableServices = Object.values(route.services).filter(
                          (value) => value !== 'NP'
                        ).length;

                        return (
                          <React.Fragment key={route._id}>
                            <tr
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => toggleRow(route._id)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-500">
                                  {isExpanded ? (
                                    <ChevronDown size={20} />
                                  ) : (
                                    <ChevronRight size={20} />
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {route.origin_zone_code}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {route.origin_zone_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {route.destin_zone_code}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {route.destin_zone_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {route.group_zone_origin || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {route.group_zone_destin || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex flex-wrap gap-1">
                                  {filters.services.map((service) => {
                                    const value = route.services[service.code];
                                    const isAvailable = value && value !== 'NP';
                                    if (!isAvailable) return null;

                                    return (
                                      <span
                                        key={service.code}
                                        title={`${service.name}: ${value}`}
                                        className="inline-flex items-center justify-center px-2 h-6 text-xs font-bold bg-green-100 text-green-800 border border-green-300 rounded cursor-help whitespace-nowrap"
                                      >
                                        {service.code}
                                      </span>
                                    );
                                  })}
                                  {availableServices === 0 && (
                                    <span className="text-xs text-gray-500">Sin servicios</span>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {filters.services.map((service) => {
                                      const value = route.services[service.code];
                                      const isAvailable = value && value !== 'NP';
                                      return (
                                        <div
                                          key={service.code}
                                          className={`p-3 rounded-lg border ${
                                            isAvailable
                                              ? 'bg-green-50 border-green-200'
                                              : 'bg-gray-100 border-gray-200'
                                          }`}
                                        >
                                          <div className="text-xs font-medium text-gray-700">
                                            {service.name}
                                          </div>
                                          <div
                                            className={`text-sm font-semibold mt-1 ${
                                              isAvailable ? 'text-green-700' : 'text-gray-500'
                                            }`}
                                          >
                                            {value || 'NP'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.total_pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.total_pages - 2) {
                        pageNum = pagination.total_pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded ${
                            pageNum === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Página {pagination.page} de {pagination.total_pages} · {pagination.total}{' '}
                    rutas totales
                  </div>
                  {pagination.total_pages > 1 && (
                    <form
                      onSubmit={handlePageJump}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <label htmlFor="page-jump" className="whitespace-nowrap">
                        Ir a página
                      </label>
                      <input
                        id="page-jump"
                        type="number"
                        min={1}
                        max={pagination.total_pages}
                        value={pageInput}
                        onChange={(event) => setPageInput(event.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                      >
                        Ir
                      </button>
                    </form>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
