// ================================================================================
// UniView — Document & CAD Viewer Library
// Main library entry — exports everything
// ================================================================================

// Buffer polyfill for browser compatibility (required by iconv-lite/shx-parser)
import './vendor/buffer-polyfill';

// Main component
export { default as UniView } from './core/UniView';

// Hooks (for headless usage)
export { useViewer } from './hooks/useViewer';
export { useAnnotations } from './hooks/useAnnotations';
export { useFileLoader } from './hooks/useFileLoader';
export { useZoom } from './hooks/useZoom';
export { usePan } from './hooks/usePan';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Utilities
export { detectFormat, isCADFormat, isImageFormat, isDocumentFormat, isSpreadsheetFormat } from './utils/fileDetector';
export { exportToImage, exportToPDF } from './utils/exportUtils';
export { aciToHex, hexToRgb, rgbToHex } from './utils/colorUtils';
export { convertUnit, unitFromCode, unitLabel } from './utils/unitConverter';

// Core
export { EventBus } from './core/EventBus';
export { PluginSystem } from './core/PluginSystem';
export { detectFromFile, detectFromExtension, getRendererGroup } from './core/FileDetector';
export { ViewerProvider, useViewerContext } from './core/ViewerContext';

// Stores
export { useViewerStore } from './store/viewerStore';
export { useAnnotationStore } from './store/annotationStore';
export { useLayerStore } from './store/layerStore';

// Types
export type {
  SupportedFormat,
  UniViewProps,
  DocumentInfo,
  CADLayer,
  UniViewPlugin,
  PluginInstance,
  PluginOptions,
  ViewerError,
  Annotation,
  ViewerEventMap,
  WorkerRequest,
  WorkerResponse,
  LoadingState,
  RendererProps,
} from './core/types';
