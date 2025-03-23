import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, List } from 'lucide-react';
import { Legend } from './Legend';
import type { ProductMapConfig } from '../types/map';

interface Position {
  x: number;
  y: number;
}

interface DraggableLegendProps {
  selectedProduct: ProductMapConfig | null;
  selectedZone: string;
}

export function DraggableLegend({ selectedProduct, selectedZone }: DraggableLegendProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const dragRef = useRef<HTMLDivElement>(null);
  const initialPosition = useRef<Position>({ x: 0, y: 0 });
  const dragStart = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragRef.current) return;
    
    const updatePosition = () => {
      if (!dragRef.current) return;
      setPosition({
        x: 16,
        y: window.innerHeight - (dragRef.current.getBoundingClientRect().height + 72)
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPosition.current = position;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      setPosition({
        x: initialPosition.current.x + deltaX,
        y: initialPosition.current.y + deltaY
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
    if (!isVisible) {
      // Reset position when showing
      if (dragRef.current) {
        setPosition({
          x: 16,
          y: window.innerHeight - (dragRef.current.getBoundingClientRect().height + 72)
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 left-4 p-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg hover:bg-gray-50 pointer-events-auto z-50"
        title={isVisible ? "Ocultar leyenda" : "Mostrar leyenda"}
      >
        <List className="w-5 h-5 text-gray-600" />
      </button>

      {isVisible && (
        <div
          ref={dragRef}
          className="fixed select-none pointer-events-auto z-50"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            maxHeight: 'calc(100vh - 100px)',
            overflow: 'visible'
          }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200">
            <div
              className="px-3 py-1.5 border-b border-gray-100/50 flex items-center justify-between cursor-grab"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Leyenda</span>
              </div>
            </div>
            <div className="p-3">
              <Legend selectedProduct={selectedProduct} selectedZone={selectedZone} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}