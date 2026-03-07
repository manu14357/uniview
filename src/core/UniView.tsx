import { Suspense, lazy, useState, useCallback, useRef, useEffect } from 'react';
import type { UniViewProps, SupportedFormat, ViewerError, DocumentInfo, RendererProps } from './types';
import { ViewerProvider } from './ViewerContext';
import { detectFromFile, detectFromExtension, detectFromMime } from './FileDetector';
import { useViewerStore } from '../store/viewerStore';
import ErrorBoundary from '../ui/common/ErrorBoundary';
import LoadingSpinner from '../ui/common/LoadingSpinner';
import Toolbar from '../ui/toolbar/Toolbar';
import AnnotationToolbar from '../ui/annotations/AnnotationToolbar';
import ToastContainer from '../ui/common/Toast';
import DropZone from '../ui/common/DropZone';

// Lazy-loaded renderers — each is a separate chunk
const PDFRenderer = lazy(() => import('../renderers/pdf/PDFRenderer'));
const DOCXRenderer = lazy(() => import('../renderers/docx/DOCXRenderer'));
const XLSXRenderer = lazy(() => import('../renderers/xlsx/XLSXRenderer'));
const ImageRenderer = lazy(() => import('../renderers/image/ImageRenderer'));
const DXFRenderer = lazy(() => import('../renderers/dxf/DXFRenderer'));
const DWGRenderer = lazy(() => import('../renderers/dwg/DWGRenderer'));

/**
 * UniView — Root component that orchestrates all viewers.
 * Auto-detects file type and routes to the appropriate lazy-loaded renderer.
 * Never imports renderers directly — uses React.lazy for code splitting.
 */
export default function UniView(props: UniViewProps) {
  const {
    theme = 'light',
    className = '',
    style,
  } = props;

  const themeClass = theme === 'dark' ? 'dark' : '';

  return (
    <ViewerProvider>
      <div
        className={`uv-root flex h-full w-full flex-col overflow-hidden ${themeClass} ${className}`}
        style={style}
        role="application"
        aria-label="UniView document viewer"
        data-theme={theme}
      >
        <UniViewInner {...props} />
        <ToastContainer />
      </div>
    </ViewerProvider>
  );
}

function UniViewInner({
  file,
  format: explicitFormat,
  theme = 'light',
  toolbar = true,
  sidebar = true,
  annotations = false,
  initialPage,
  initialZoom,
  onLoad,
  onError,
  onPageChange,
  onZoomChange,
}: UniViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [detectedFormat, setDetectedFormat] = useState<SupportedFormat | null>(null);
  const [_sidebarOpen, _setSidebarOpen] = [sidebar, sidebar]; // sidebar disabled
  const [annotationsActive, setAnnotationsActive] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const store = useViewerStore();

  // Load file data
  useEffect(() => {
    let cancelled = false;

    const loadFile = async () => {
      try {
        const s = useViewerStore.getState();
        s.setLoading(true);
        s.setError(null);

        let data: ArrayBuffer;
        let name = '';
        let fmt: SupportedFormat | undefined = explicitFormat;

        if (file instanceof File) {
          data = await file.arrayBuffer();
          name = file.name;
          if (!fmt) {
            fmt = detectFromFile(file) ?? undefined;
          }
        } else if (typeof file === 'string') {
          // URL — detect format from URL path first
          if (!fmt) {
            fmt = detectFromExtension(file) ?? undefined;
          }
          const response = await fetch(file);
          if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
          // Fallback: detect from Content-Type header
          if (!fmt) {
            const contentType = response.headers.get('content-type')?.split(';')[0]?.trim();
            if (contentType) {
              fmt = detectFromMime(contentType) ?? undefined;
            }
          }
          data = await response.arrayBuffer();
          name = file.split('/').pop()?.split('?')[0]?.split('#')[0] ?? 'document';
        } else {
          // ArrayBuffer
          data = file;
          name = 'document';
        }

        if (cancelled) return;

        if (!fmt) {
          throw new Error('Unable to detect file format. Please specify the format prop.');
        }

        setFileData(data);
        setFileName(name);
        setDetectedFormat(fmt);
        const s2 = useViewerStore.getState();
        s2.setFormat(fmt);
        s2.setFileName(name);
        s2.setFileData(data);
        s2.setLoading(false);

        if (initialPage) s2.setCurrentPage(initialPage);
        if (typeof initialZoom === 'number') s2.setZoom(initialZoom);
        if (initialZoom === 'fit') s2.setZoom(1);
        if (initialZoom === 'width') s2.setZoom(1);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load file';
        setLoadError(msg);
        useViewerStore.getState().setLoading(false);
        const viewerError: ViewerError = {
          code: 'FILE_LOAD_ERROR',
          message: msg,
          originalError: err instanceof Error ? err : undefined,
        };
        useViewerStore.getState().setError(viewerError);
        onError?.(viewerError);
      }
    };

    if (file) {
      loadFile();
    }

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, explicitFormat, initialPage, initialZoom, onError]);

  // Watch for page changes
  useEffect(() => {
    const unsub = useViewerStore.subscribe((state) => {
      onPageChange?.(state.currentPage);
    });
    return unsub;
  }, [onPageChange]);

  // Watch for zoom changes
  useEffect(() => {
    const unsub = useViewerStore.subscribe((state) => {
      onZoomChange?.(state.zoom);
    });
    return unsub;
  }, [onZoomChange]);

  const handleLoad = useCallback(
    (info: DocumentInfo) => {
      onLoad?.(info);
    },
    [onLoad],
  );

  const handleError = useCallback(
    (error: ViewerError) => {
      onError?.(error);
    },
    [onError],
  );

  const handleFullscreen = useCallback(() => {
    if (rootRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        rootRef.current.requestFullscreen();
      }
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!fileData) return;
    const blob = new Blob([fileData]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document';
    a.click();
    URL.revokeObjectURL(url);
  }, [fileData, fileName]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleFileDrop = useCallback(
    (droppedFile: File) => {
      // Re-triggers load via state change
      const fmt = detectFromFile(droppedFile) ?? undefined;
      setDetectedFormat(fmt ?? null);
      droppedFile.arrayBuffer().then((data) => {
        setFileData(data);
        setFileName(droppedFile.name);
      });
    },
    [],
  );

  // Determine format category for conditional rendering
  const isCAD = detectedFormat === 'dxf' || detectedFormat === 'dwg';

  // Renderer props
  const rendererProps: RendererProps = {
    fileData: fileData!,
    fileName,
    theme,
    layout: 'continuous',
    initialPage: initialPage ?? 1,
    initialZoom: typeof initialZoom === 'number' ? initialZoom : 1,
    annotations,
    onLoad: handleLoad,
    onError: handleError,
  };

  // Select renderer by format
  const renderDocument = () => {
    if (!fileData || !detectedFormat) {
      return <DropZone onFileDrop={handleFileDrop} className="m-8" />;
    }

    const suspenseFallback = isCAD
      ? <div className="h-full w-full" style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc' }} />
      : <LoadingSpinner message="Loading renderer..." />;

    return (
      <ErrorBoundary onError={handleError}>
        <Suspense fallback={suspenseFallback}>
          {getRendererComponent(detectedFormat, rendererProps)}
        </Suspense>
      </ErrorBoundary>
    );
  };

  if (loadError && !fileData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8" role="alert">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">{loadError}</p>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex h-full flex-col">
      {/* Toolbar */}
      {toolbar && (
        <Toolbar
          toolbar={toolbar}
          sidebar={false}
          annotations={annotations}
          onToggleSidebar={() => {}}
          onToggleAnnotations={() => setAnnotationsActive((a) => !a)}
          onFullscreen={handleFullscreen}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document area */}
        <div className="relative flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          {store.isLoading && !isCAD ? (
            <LoadingSpinner message="Loading document..." />
          ) : (
            renderDocument()
          )}
        </div>
      </div>

      {/* Floating annotation toolbar */}
      {annotations && annotationsActive && (
        <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
          <AnnotationToolbar />
        </div>
      )}
    </div>
  );
}

/** Maps format to lazy-loaded renderer component */
function getRendererComponent(format: SupportedFormat, props: RendererProps) {
  switch (format) {
    case 'pdf':
      return <PDFRenderer {...props} />;
    case 'docx':
    case 'doc':
      return <DOCXRenderer {...props} />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <XLSXRenderer {...props} />;
    case 'dxf':
      return <DXFRenderer {...props} />;
    case 'dwg':
      return <DWGRenderer {...props} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'tiff':
    case 'bmp':
    case 'webp':
      return <ImageRenderer {...props} />;
    case 'txt':
    case 'rtf':
      return <TextRenderer {...props} />;
    default:
      return (
        <div className="flex h-full items-center justify-center text-gray-500">
          <p>Unsupported format: {format}</p>
        </div>
      );
  }
}

/** Simple plain text / RTF renderer */
function TextRenderer({ fileData, fileName, onLoad }: RendererProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    const decoder = new TextDecoder();
    setText(decoder.decode(fileData));
    onLoad?.({
      format: 'txt',
      fileName,
      fileSize: fileData.byteLength,
      pageCount: 1,
    });
  }, [fileData, fileName, onLoad]);

  return (
    <div className="h-full overflow-auto p-6">
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
        {text}
      </pre>
    </div>
  );
}
