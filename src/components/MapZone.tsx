import React from 'react';
import { baremoColors } from '../config/baremos';

interface MapZoneProps {
  id: string;
  d: string;
  x?: string;
  y?: string;
  cx?: string;
  cy?: string;
  rx?: string;
  ry?: string;
  width?: string;
  height?: string;
  color: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

export function MapZone({ id, d, x, y, cx, cy, rx, ry, width, height, color, name, isSelected, onClick }: MapZoneProps) {
  const baremoName = React.useMemo(() => {
    const baremo = baremoColors.find(b => b.color === color);
    return baremo ? baremo.name : 'No permitido';
  }, [color]);

  const isRect = !d && x && y && width && height;
  const isEllipse = !d && !isRect && cx && cy && rx && ry;

  return (
    <g>
      <title>{`${name} - ${baremoName}`}</title>
      {isEllipse ? (
        <ellipse
          id={id}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={color}
          stroke={isSelected ? '#000' : '#e2e8f0'}
          strokeWidth={isSelected ? '1.5' : '0.75'}
          className="transition-all duration-300 ease-in-out hover:brightness-95"
        />
      ) : isRect ? (
        <rect
          id={id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#ffffff"
          stroke={isSelected ? '#000' : '#e2e8f0'}
          strokeWidth={isSelected ? '1.5' : '0.75'}
          className="transition-all duration-300 ease-in-out hover:brightness-95"
        />
      ) : (
        <path
          id={id}
          d={d}
          fill={color}
          stroke={isSelected ? '#000' : '#e2e8f0'}
          strokeWidth={isSelected ? '1.5' : '0.75'}
          className="transition-all duration-300 ease-in-out hover:brightness-95 cursor-pointer"
          onClick={onClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(0.95)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
          }}
        />
      )}
    </g>
  );
}