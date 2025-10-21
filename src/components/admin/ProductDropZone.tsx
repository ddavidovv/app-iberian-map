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
  }), [onDrop]);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={`relative min-h-[300px] rounded-xl transition-all duration-200 ${
        isActive
          ? 'ring-4 ring-purple-500 bg-purple-100/50 scale-[1.01]'
          : canDrop
          ? 'ring-4 ring-purple-300 ring-dashed bg-purple-50/30'
          : ''
      }`}
    >
      {isEmpty && (
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-4 border-dashed transition-all duration-200 py-16 ${
            isActive
              ? 'border-purple-600 bg-purple-200/50 scale-105'
              : canDrop
              ? 'border-purple-400 bg-purple-100/50 animate-pulse'
              : 'border-gray-300 bg-gray-50/50'
          }`}
        >
          <Package
            className={`h-16 w-16 mb-4 transition-all duration-200 ${
              isActive
                ? 'text-purple-700 scale-125'
                : canDrop
                ? 'text-purple-500 scale-110'
                : 'text-gray-300'
            }`}
          />
          <p
            className={`text-base font-bold transition-all duration-200 ${
              isActive ? 'text-purple-800 text-lg' : canDrop ? 'text-purple-700' : 'text-gray-500'
            }`}
          >
            {isActive
              ? '⬇️ ¡SUELTA AQUÍ PARA AÑADIR!'
              : canDrop
              ? '👆 Arrastra productos aquí'
              : 'Arrastra productos desde el panel lateral →'}
          </p>
        </div>
      )}
      {!isEmpty && (
        <>
          {isActive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-purple-600/20 backdrop-blur-sm border-4 border-purple-600 border-dashed animate-pulse">
              <div className="rounded-xl bg-purple-600 px-8 py-4 text-white text-lg font-bold shadow-2xl scale-110">
                ⬇️ ¡SUELTA AQUÍ PARA AÑADIR!
              </div>
            </div>
          )}
          {canDrop && !isActive && (
            <div className="absolute inset-0 z-5 rounded-xl border-4 border-purple-400 border-dashed bg-purple-100/20 pointer-events-none animate-pulse" />
          )}
          {children}
        </>
      )}
    </div>
  );
}
