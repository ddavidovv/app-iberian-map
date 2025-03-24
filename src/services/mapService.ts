import type { MapData, MapZoneData } from '../types/map';

async function fetchSvgContent(): Promise<string> {
  const response = await fetch('/assets/iberian_map.svg');
  if (!response.ok) throw new Error('Failed to load SVG map');
  return response.text();
}

function parseSvgContent(svgContent: string): MapData {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  
  // Get viewBox from the SVG
  const svg = svgDoc.querySelector('svg');
  const viewBox = svg?.getAttribute('viewBox') || '0 0 800 600';
  
  // Get all path, rect, and ellipse elements that represent zones
  const elements = Array.from(svgDoc.querySelectorAll('path, rect, ellipse'));
  
  const zones: MapZoneData[] = elements.map(element => {
    const tagName = element.tagName.toLowerCase();
    
    return {
      id: element.id,
      ...(tagName === 'rect' ? {
        x: element.getAttribute('x') || '0',
        y: element.getAttribute('y') || '0',
        width: element.getAttribute('width') || '0',
        height: element.getAttribute('height') || '0',
      } : tagName === 'ellipse' ? {
        cx: element.getAttribute('cx') || '0',
        cy: element.getAttribute('cy') || '0',
        rx: element.getAttribute('rx') || '0',
        ry: element.getAttribute('ry') || '0',
      } : {
        d: element.getAttribute('d') || '',
      }),
      name: element.getAttribute('data-name') || element.id,
    };
  }).filter(zone => zone.id && (
    zone.d || 
    (zone.x && zone.y && zone.width && zone.height) ||
    (zone.cx && zone.cy && zone.rx && zone.ry)
  ));

  return { viewBox, zones };
}

export async function getMapData(): Promise<MapData> {
  try {
    const svgContent = await fetchSvgContent();
    return parseSvgContent(svgContent);
  } catch (error) {
    console.error('Error loading map data:', error);
    throw error;
  }
}