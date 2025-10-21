interface ProductProgressProps {
  activeCount: number;
  totalCount: number;
  compact?: boolean;
}

export function ProductProgress({ activeCount, totalCount, compact = false }: ProductProgressProps) {
  const percentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  const getColorClass = () => {
    if (percentage === 0) return 'text-gray-500 bg-gray-100';
    if (percentage < 30) return 'text-red-700 bg-red-100';
    if (percentage < 70) return 'text-amber-700 bg-amber-100';
    return 'text-emerald-700 bg-emerald-100';
  };

  const getProgressBarColor = () => {
    if (percentage === 0) return 'bg-gray-400';
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getColorClass()}`}>
          {activeCount}/{totalCount}
        </span>
        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor()} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {activeCount} de {totalCount} activos
        </span>
        <span className={`font-medium ${getColorClass().split(' ')[0]}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressBarColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
