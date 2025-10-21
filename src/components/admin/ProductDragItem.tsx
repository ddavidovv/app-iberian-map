import React from 'react';
import { useDrag } from 'react-dnd';
import { GripVertical, CheckCircle2 } from 'lucide-react';

interface ProductDragItemProps {
  productName: string;
  origin: string;
  onDrop?: (productName: string) => void;
  isSelected?: boolean;
  compact?: boolean;
}

export const PRODUCT_DRAG_TYPE = 'PRODUCT';

export function ProductDragItem({ productName, origin, onDrop, isSelected = false, compact = false }: ProductDragItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: PRODUCT_DRAG_TYPE,
    item: { productName, origin },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [productName, origin]);

  const handleClick = () => {
    if (onDrop) {
      onDrop(productName);
    }
  };

  // Compact mode - pequeño chip/badge
  if (compact) {
    return (
      <div
        ref={drag}
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'bg-purple-600 border-purple-600 text-white shadow-lg scale-105'
            : isDragging
            ? 'opacity-50 scale-90 border-purple-500 bg-purple-100 text-purple-700'
            : 'border-purple-200 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md hover:scale-105'
        }`}
        style={{ touchAction: 'none' }}
      >
        {isSelected ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <GripVertical className="h-3.5 w-3.5 text-purple-400" />
        )}
        <span>{productName}</span>
      </div>
    );
  }

  // Full mode - tarjeta grande original
  return (
    <div
      ref={drag}
      className={`group flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 transition-all duration-200 ${
        isDragging
          ? 'opacity-50 scale-90 border-purple-500 shadow-2xl bg-purple-100 cursor-grabbing'
          : 'border-purple-200 bg-gradient-to-r from-white to-purple-50 hover:border-purple-400 hover:shadow-xl hover:scale-105 cursor-grab active:cursor-grabbing'
      }`}
      style={{ touchAction: 'none' }}
    >
      <div className={`flex items-center justify-center rounded-lg p-2 transition-all duration-200 ${
        isDragging ? 'bg-purple-500' : 'bg-purple-100 group-hover:bg-purple-500'
      }`}>
        <GripVertical
          className={`h-5 w-5 transition-all duration-200 ${
            isDragging ? 'text-white' : 'text-purple-600 group-hover:text-white group-hover:scale-110'
          }`}
        />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold transition-colors ${
          isDragging ? 'text-purple-700' : 'text-gray-800 group-hover:text-purple-700'
        }`}>
          {productName}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Arrastra para añadir →</p>
      </div>
    </div>
  );
}
