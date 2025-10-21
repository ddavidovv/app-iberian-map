import { useState, useRef, useEffect } from 'react';
import { MoreVertical, CheckCircle, XCircle, Copy } from 'lucide-react';

interface ProductActionsMenuProps {
  productCode: string;
  productName: string;
  onActivateAll: () => void;
  onDeactivateAll: () => void;
  onCopyConfiguration?: () => void;
}

export function ProductActionsMenu({
  productCode,
  productName,
  onActivateAll,
  onDeactivateAll,
  onCopyConfiguration,
}: ProductActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Más acciones"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
          <button
            onClick={() => handleAction(onActivateAll)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          >
            <CheckCircle className="w-4 h-4 text-green-600" />
            Activar todos
          </button>
          <button
            onClick={() => handleAction(onDeactivateAll)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
          >
            <XCircle className="w-4 h-4 text-red-600" />
            Desactivar todos
          </button>
          {onCopyConfiguration && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => handleAction(onCopyConfiguration)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Copy className="w-4 h-4 text-blue-600" />
                Copiar configuración
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
