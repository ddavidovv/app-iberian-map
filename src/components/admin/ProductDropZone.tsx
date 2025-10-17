import React from 'react';
import { useDrop } from 'react-dnd';
import { Package } from 'lucide-react';
import { PRODUCT_DRAG_TYPE } from './ProductDragItem';

interface ProductDropZoneProps {
  onDrop: (productName: string, origin: string) => void;
  children: React.ReactNode;
  isEmpty?: boolean;
}

export function ProductDropZone({ onDrop, children, isEmpty }: ProductDropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: PRODUCT_DRAG_TYPE,
    drop: (item: { productName: string; origin: string }) => {
      onDrop(item.productName, item.origin);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }));

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`relative min-h-[200px] transition-all duration-200 ${
        isActive
          ? 'ring-4 ring-purple-400 ring-offset-2 bg-purple-50/50'
          : canDrop
          ? 'ring-2 ring-purple-200 ring-dashed'
          : ''
      }`}
    >
      {isEmpty && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            isActive
              ? 'border-purple-500 bg-purple-100/50'
              : canDrop
              ? 'border-purple-300 bg-purple-50/30'
              : 'border-gray-300 bg-gray-50/50'
          }`}
        >
          <Package
            className={`h-12 w-12 mb-3 transition-colors ${
              isActive ? 'text-purple-600' : canDrop ? 'text-purple-400' : 'text-gray-300'
            }`}
          />
          <p
            className={`text-sm font-medium transition-colors ${
              isActive ? 'text-purple-700' : canDrop ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            {isActive
              ? '¡Suelta aquí para añadir!'
              : canDrop
              ? 'Arrastra productos aquí'
              : 'Arrastra productos desde el panel lateral para comenzar'}
          </p>
        </div>
      )}
      {!isEmpty && (
        <>
          {isActive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-purple-600/10 backdrop-blur-sm border-2 border-purple-500 border-dashed">
              <div className="rounded-lg bg-purple-600 px-6 py-3 text-white font-semibold shadow-xl">
                ¡Suelta para añadir producto!
              </div>
            </div>
          )}
          {children}
        </>
      )}
    </div>
  );
}
