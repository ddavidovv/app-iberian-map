import { Search, Filter, X } from 'lucide-react';

interface MatrixToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterStatus: 'all' | 'active' | 'inactive' | 'partial';
  onFilterChange: (status: 'all' | 'active' | 'inactive' | 'partial') => void;
  selectedGroupFilter: string;
  onGroupFilterChange: (groupId: string) => void;
  availableGroups: Array<{ group_id: string; name: string; code: string }>;
  totalProducts: number;
  filteredProducts: number;
}

export function MatrixToolbar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  selectedGroupFilter,
  onGroupFilterChange,
  availableGroups,
  totalProducts,
  filteredProducts,
}: MatrixToolbarProps) {
  const statusOptions = [
    { value: 'all', label: 'Todos', count: totalProducts },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'partial', label: 'Parciales' },
  ] as const;

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || selectedGroupFilter;

  const clearAllFilters = () => {
    onSearchChange('');
    onFilterChange('all');
    onGroupFilterChange('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o código..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results count */}
        {searchTerm && (
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {filteredProducts} de {totalProducts}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
        </div>

        {/* Status Filter */}
        <div className="flex gap-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${filterStatus === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {option.label}
              {option.count !== undefined && ` (${option.count})`}
            </button>
          ))}
        </div>

        {/* Group Filter */}
        {availableGroups.length > 0 && (
          <select
            value={selectedGroupFilter}
            onChange={(e) => onGroupFilterChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los grupos</option>
            {availableGroups.map((group) => (
              <option key={group.group_id} value={group.group_id}>
                {group.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="ml-auto flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              Búsqueda: "{searchTerm}"
              <button onClick={() => onSearchChange('')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              Estado: {statusOptions.find(o => o.value === filterStatus)?.label}
              <button onClick={() => onFilterChange('all')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedGroupFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              Grupo: {availableGroups.find(g => g.group_id === selectedGroupFilter)?.name}
              <button onClick={() => onGroupFilterChange('')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
