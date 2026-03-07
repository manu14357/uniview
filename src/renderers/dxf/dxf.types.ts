import type { CADLayer, DocumentInfo } from '../../core/types';

/** DXF entity types */
export type DXFEntityType =
  | 'LINE'
  | 'CIRCLE'
  | 'ARC'
  | 'POLYLINE'
  | 'LWPOLYLINE'
  | 'SPLINE'
  | 'ELLIPSE'
  | 'INSERT'
  | 'TEXT'
  | 'MTEXT'
  | 'DIMENSION'
  | 'HATCH'
  | 'POINT'
  | 'SOLID'
  | '3DFACE';

/** Parsed DXF entity */
export interface DXFEntity {
  type: DXFEntityType;
  layer: string;
  color?: number;
  vertices?: Array<{ x: number; y: number; z?: number }>;
  center?: { x: number; y: number; z?: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  text?: string;
  blockName?: string;
}

/** DXF parsed document */
export interface DXFDocumentData {
  entities: DXFEntity[];
  layers: CADLayer[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  blocks: Record<string, DXFEntity[]>;
  units: number;
}

/** Convert DXF data to DocumentInfo */
export function toDocumentInfo(
  data: DXFDocumentData,
  fileName: string,
  fileSize: number,
): DocumentInfo {
  return {
    format: 'dxf',
    fileName,
    fileSize,
    pageCount: 1,
    layers: data.layers,
  };
}
