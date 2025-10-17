import React from 'react';
import { useDrag } from 'react-dnd';
import { GripVertical } from 'lucide-react';

interface ProductDragItemProps {
  productName: string;
  origin: string;
}

export const PRODUCT_DRAG_TYPE = 'PRODUCT';

export function ProductDragItem({ productName, origin }: ProductDragItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: PRODUCT_DRAG_TYPE,
    item: { productName, origin },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className={`group flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 scale-95 border-purple-400 shadow-lg'
          : 'hover:border-purple-300 hover:shadow-md hover:scale-102'
      }`}
    >
      <GripVertical
        className={`h-5 w-5 transition-colors ${
          isDragging ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'
        }`}
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{productName}</p>
      </div>
    </div>
  );
}
