import type { CADLayer, DocumentInfo } from '../../core/types';

/** DWG entity (similar to DXF but from WASM parser) */
export interface DWGEntity {
  type: string;
  layer: string;
  color?: number;
  handle: string;
  vertices?: Array<{ x: number; y: number; z?: number }>;
  center?: { x: number; y: number; z?: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  text?: string;
}

/** DWG parsed document data */
export interface DWGDocumentData {
  entities: DWGEntity[];
  layers: CADLayer[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  blocks: Record<string, DWGEntity[]>;
  units: number;
  version: string;
}

/** Convert DWG data to DocumentInfo */
export function toDocumentInfo(
  data: DWGDocumentData,
  fileName: string,
  fileSize: number,
): DocumentInfo {
  return {
    format: 'dwg',
    fileName,
    fileSize,
    pageCount: 1,
    layers: data.layers,
  };
}
