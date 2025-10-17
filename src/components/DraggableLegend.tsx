import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { BaremoLegend } from './BaremoLegend';
import type { LegendEntry } from '../context/ShippingMapContext';

interface Position {
  x: number;
  y: number;
}

interface DraggableLegendProps {
  entries: LegendEntry[];
  title?: string;
  initialPosition?: Position;
  containerRef?: React.RefObject<HTMLElement>;
  anchor?: 'top-left' | 'bottom-right';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const LEGEND_PADDING = 24;

export function DraggableLegend({
  entries,
  title = 'Leyenda de baremos',
  initialPosition,
  containerRef,
  anchor = 'top-left',
}: DraggableLegendProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef<Position>({ x: 0, y: 0 });
  const startPointerRef = useRef<Position>({ x: 0, y: 0 });

  const [position, setPosition] = useState<Position>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const calculateBounds = useCallback(
    (panelWidth: number, panelHeight: number) => {
      const containerRect = containerRef?.current?.getBoundingClientRect();
      if (containerRect) {
        const { left, top, right, bottom } = containerRect;
        return {
          minX: left + LEGEND_PADDING,
          maxX: Math.max(left + LEGEND_PADDING, right - LEGEND_PADDING - panelWidth),
          minY: top + LEGEND_PADDING,
          maxY: Math.max(top + LEGEND_PADDING, bottom - LEGEND_PADDING - panelHeight),
        };
      }

      if (typeof window === 'undefined') {
        return {
          minX: LEGEND_PADDING,
          maxX: LEGEND_PADDING,
          minY: LEGEND_PADDING,
          maxY: LEGEND_PADDING,
        };
      }

      return {
        minX: LEGEND_PADDING,
        maxX: Math.max(LEGEND_PADDING, window.innerWidth - LEGEND_PADDING - panelWidth),
        minY: LEGEND_PADDING,
        maxY: Math.max(LEGEND_PADDING, window.innerHeight - LEGEND_PADDING - panelHeight),
      };
    },
    [containerRef],
  );

  useEffect(() => {
    if (!entries.length || typeof window === 'undefined') {
      return;
    }

    const recalcPosition = () => {
      if (!panelRef.current) return;
      const { width, height } = panelRef.current.getBoundingClientRect();
      const bounds = calculateBounds(width, height);

      let desiredX = bounds.minX;
      let desiredY = bounds.minY;

      if (initialPosition) {
        desiredX = initialPosition.x;
        desiredY = initialPosition.y;
      } else if (anchor === 'bottom-right') {
        desiredX = bounds.maxX;
        desiredY = bounds.maxY;
      }

      setPosition({
        x: clamp(desiredX, bounds.minX, bounds.maxX),
        y: clamp(desiredY, bounds.minY, bounds.maxY),
      });
    };

    recalcPosition();
    window.addEventListener('resize', recalcPosition);

    const containerElement = containerRef?.current;
    const observer =
      containerElement && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => recalcPosition())
        : null;

    if (observer && containerElement) {
      observer.observe(containerElement);
    }

    return () => {
      window.removeEventListener('resize', recalcPosition);
      observer?.disconnect();
    };
  }, [entries.length, initialPosition, anchor, calculateBounds, containerRef]);

  useEffect(() => {
    if (!isDragging || typeof window === 'undefined') {
      return;
    }

    const handlePointerMove = (event: MouseEvent) => {
      if (!panelRef.current) return;
      const { width, height } = panelRef.current.getBoundingClientRect();
      const bounds = calculateBounds(width, height);
      const nextX = dragOriginRef.current.x + (event.clientX - startPointerRef.current.x);
      const nextY = dragOriginRef.current.y + (event.clientY - startPointerRef.current.y);
      setPosition({
        x: clamp(nextX, bounds.minX, bounds.maxX),
        y: clamp(nextY, bounds.minY, bounds.maxY),
      });
    };

    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [isDragging, calculateBounds]);

  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    setIsDragging(true);
    dragOriginRef.current = position;
    startPointerRef.current = { x: event.clientX, y: event.clientY };
  };

  if (!entries.length) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <div
        ref={panelRef}
        className="pointer-events-auto fixed select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        <div className="w-72 max-w-[320px] bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-200">
          <div
            className="px-3 py-2 border-b border-slate-100 flex items-center justify-between cursor-grab"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <GripVertical className="w-4 h-4 text-slate-400" />
              {title}
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1 rounded-md hover:bg-slate-100 transition-colors"
              aria-label={isCollapsed ? 'Expandir leyenda' : 'Colapsar leyenda'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
          {!isCollapsed && (
            <div className="p-3 max-h-64 overflow-auto">
              <BaremoLegend entries={entries} variant="compact" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
