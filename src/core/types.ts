import type { CSSProperties, ReactNode } from 'react';

/** Supported file format identifiers */
export type SupportedFormat =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'xlsx'
  | 'xls'
  | 'csv'
  | 'dxf'
  | 'dwg'
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'svg'
  | 'tiff'
  | 'bmp'
  | 'webp'
  | 'txt'
  | 'rtf';

/** Theme modes */
export type ThemeMode = 'light' | 'dark' | 'auto';

/** Page layout modes */
export type LayoutMode = 'single' | 'continuous' | 'facing';

/** Zoom presets */
export type ZoomPreset = 'fit' | 'width';

/** Main UniView component props */
export interface UniViewProps {
  /** File to render — accepts a File object, URL string, or raw ArrayBuffer */
  file: File | string | ArrayBuffer;
  /** File format — auto-detected from extension/MIME if omitted */
  format?: SupportedFormat;
  /** Visual theme */
  theme?: ThemeMode;
  /** Page layout mode */
  layout?: LayoutMode;
  /** Show/hide toolbar (default: true) */
  toolbar?: boolean;
  /** Show/hide sidebar (default: true) */
  sidebar?: boolean;
  /** Enable annotation tools */
  annotations?: boolean;
  /** Starting page/sheet (1-indexed) */
  initialPage?: number;
  /** Starting zoom level — number (e.g. 1 = 100%) or preset */
  initialZoom?: number | ZoomPreset;
  /** Fires when document is loaded */
  onLoad?: (info: DocumentInfo) => void;
  /** Fires on any error */
  onError?: (error: ViewerError) => void;
  /** Fires on page change */
  onPageChange?: (page: number) => void;
  /** Fires on zoom change */
  onZoomChange?: (zoom: number) => void;
  /** Custom CSS class on root element */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
}

/** Document metadata returned on load */
export interface DocumentInfo {
  format: SupportedFormat;
  fileName: string;
  fileSize: number;
  pageCount: number;
  title?: string;
  author?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  /** Populated for DWG/DXF only */
  layers?: CADLayer[];
  /** Populated for XLSX only — sheet names */
  sheets?: string[];
}

/** CAD Layer descriptor */
export interface CADLayer {
  id: string;
  name: string;
  /** Hex color string, e.g. '#FF0000' */
  color: string;
  visible: boolean;
  locked: boolean;
  lineType?: string;
  lineWeight?: number;
}

/** Plugin options passed to renderer */
export interface PluginOptions {
  theme: ThemeMode;
  layout: LayoutMode;
  initialPage: number;
  initialZoom: number;
  annotations: boolean;
}

/** Plugin instance returned after rendering */
export interface PluginInstance {
  /** Destroy the renderer and clean up resources */
  destroy: () => void;
  /** Navigate to a specific page */
  goToPage?: (page: number) => void;
  /** Set zoom level */
  setZoom?: (zoom: number) => void;
  /** Get current document info */
  getInfo?: () => DocumentInfo;
}

/** Plugin interface for extending UniView */
export interface UniViewPlugin {
  name: string;
  version: string;
  supportedFormats: SupportedFormat[];
  render: (
    container: HTMLElement,
    file: ArrayBuffer,
    options: PluginOptions,
  ) => Promise<PluginInstance>;
}

/** Viewer error */
export interface ViewerError {
  code: string;
  message: string;
  format?: SupportedFormat;
  originalError?: Error;
}

/** Annotation tool types */
export type AnnotationTool = 'select' | 'pen' | 'highlight' | 'arrow' | 'rectangle' | 'text';

/** Annotation data */
export interface Annotation {
  id: string;
  tool: AnnotationTool;
  color: string;
  lineWidth: number;
  pageNumber: number;
  /** SVG path data or coordinates depending on tool */
  data: AnnotationPathData | AnnotationShapeData | AnnotationTextData;
  createdAt: Date;
}

export interface AnnotationPathData {
  type: 'path';
  points: Array<{ x: number; y: number }>;
}

export interface AnnotationShapeData {
  type: 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  endX?: number;
  endY?: number;
}

export interface AnnotationTextData {
  type: 'text';
  x: number;
  y: number;
  content: string;
  fontSize: number;
}

/** Event types for the EventBus */
export type ViewerEventMap = {
  'document:loaded': DocumentInfo;
  'document:error': ViewerError;
  'page:change': number;
  'zoom:change': number;
  'rotation:change': number;
  'layer:toggle': { layerId: string; visible: boolean };
  'annotation:add': Annotation;
  'annotation:remove': string;
  'annotation:clear': void;
  'theme:change': ThemeMode;
  'sidebar:toggle': boolean;
  'search:query': string;
  'search:result': { total: number; current: number };
  'export:request': ExportOptions;
  'export:complete': ExportResult;
  'export:error': ViewerError;
};

/** Worker message types */
export interface WorkerRequest<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: string;
  payload: T;
  error?: string;
}

/** Loading state */
export interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
}

/** Renderer component props (base interface for all renderers) */
export interface RendererProps {
  fileData: ArrayBuffer;
  fileName: string;
  theme: ThemeMode;
  layout: LayoutMode;
  initialPage: number;
  initialZoom: number;
  annotations: boolean;
  onLoad?: (info: DocumentInfo) => void;
  onError?: (error: ViewerError) => void;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
}

/** React children prop helper */
export interface WithChildren {
  children: ReactNode;
}

/** Export format for CAD file conversion */
export type ExportFormat = 'svg' | 'png' | 'jpeg' | 'pdf';

/** Options for exporting a CAD drawing */
export interface ExportOptions {
  format: ExportFormat;
  /** Pixel scale multiplier for raster exports (default: 2) */
  scale?: 1 | 2 | 4;
  /** Background color hex (default: '#FFFFFF') */
  background?: string;
  /** Output file name (auto-generated if omitted) */
  fileName?: string;
}

/** Result of a successful export */
export interface ExportResult {
  blob: Blob;
  fileName: string;
  format: ExportFormat;
}
