import { useState } from 'react';

interface BaremoToggleProps {
  isActive: boolean;
  onToggle: () => Promise<void> | void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function BaremoToggle({ isActive, onToggle, disabled = false, size = 'md' }: BaremoToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = size === 'sm'
    ? 'w-9 h-5'
    : 'w-11 h-6';

  const dotSizeClasses = size === 'sm'
    ? 'w-4 h-4'
    : 'w-5 h-5';

  const translateClasses = size === 'sm'
    ? 'translate-x-4'
    : 'translate-x-5';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative inline-flex ${sizeClasses} flex-shrink-0
        cursor-pointer rounded-full border-2 border-transparent
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isLoading
          ? 'bg-amber-400 focus:ring-amber-500'
          : isActive
            ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500'
            : 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-400'
        }
      `}
      role="switch"
      aria-checked={isActive}
      title={isLoading ? 'Guardando...' : isActive ? 'Desactivar' : 'Activar'}
    >
      <span className="sr-only">{isActive ? 'Desactivar' : 'Activar'}</span>
      <span
        aria-hidden="true"
        className={`
          ${dotSizeClasses} inline-block transform rounded-full
          bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out
          ${isActive || isLoading ? translateClasses : 'translate-x-0'}
          ${isLoading ? 'animate-pulse' : ''}
        `}
      />
    </button>
  );
}
