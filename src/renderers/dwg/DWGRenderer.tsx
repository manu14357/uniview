import { useEffect, useRef, useState, useCallback } from 'react';
import type { RendererProps, DocumentInfo, CADLayer, ViewerError } from '../../core/types';
import { toDocumentInfo } from './dwg.types';
import { EventBus } from '../../core/EventBus';
import { useViewerStore } from '../../store/viewerStore';
import CADToolbar from '../../ui/toolbar/CADToolbar';
import type { CADCoordinates } from '../../ui/toolbar/CADToolbar';
import type {
  UvApDocManager as UvApDocManagerType,
  UvTrView2d as UvTrView2dType,
} from '@uniview/viewer';

/**
 * DWG Renderer — uses @uniview/viewer for high-quality DWG/DXF rendering.
 *
 * All zoom, pan, coordinate conversion and view-mode switching is done through
 * the vendor's own `UvTrView2d` API so that Three.js OrbitControls stay in sync.
 */
export default function DWGRenderer({
  fileData,
  fileName,
  theme,
  onLoad,
  onError,
}: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const docManagerRef = useRef<UvApDocManagerType | null>(null);
  const viewRef = useRef<UvTrView2dType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<'detecting' | 'engine' | 'parsing' | 'rendering'>('detecting');
  const [errorState, setErrorState] = useState<string | null>(null);

  // CAD toolbar state
  const [coords, setCoords] = useState<CADCoordinates>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeMode, setActiveMode] = useState<'select' | 'pan'>('pan');

  const handleError = useCallback((message: string, err?: unknown) => {
    setIsLoading(false);
    setErrorState(message);
    const viewerError: ViewerError = {
      code: 'DWG_RENDER_ERROR',
      message,
      format: 'dwg',
      originalError: err instanceof Error ? err : undefined,
    };
    console.error('[DWG Renderer]', err ?? message);
    onError?.(viewerError);
    EventBus.emit('document:error', viewerError);
  }, [onError]);

  /* ── Zoom helpers — use the vendor's flyTo / zoomToFitDrawing ── */
  const handleZoomIn = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    const center = view.center;
    const cam = view.activeLayoutView;
    // Zoom in by flying to the same center at 1.3x the current camera zoom
    const currentZoom = (cam as unknown as { _camera: { zoom: number } })._camera?.zoom ?? 1;
    view.flyTo(center, currentZoom * 1.3);
    view.isDirty = true;
    setZoomLevel(currentZoom * 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    const center = view.center;
    const cam = view.activeLayoutView;
    const currentZoom = (cam as unknown as { _camera: { zoom: number } })._camera?.zoom ?? 1;
    view.flyTo(center, currentZoom / 1.3);
    view.isDirty = true;
    setZoomLevel(currentZoom / 1.3);
  }, []);

  const handleFitView = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    view.zoomToFitDrawing();
  }, []);

  const handleGoToCoordinates = useCallback((target: CADCoordinates) => {
    const view = viewRef.current;
    if (!view) return;
    const cam = view.activeLayoutView;
    const currentZoom = (cam as unknown as { _camera: { zoom: number } })._camera?.zoom ?? 1;
    view.flyTo({ x: target.x, y: target.y }, currentZoom);
    view.isDirty = true;
  }, []);

  /* ── Sync view mode from toolbar to vendor ── */
  const handleModeChange = useCallback((mode: 'select' | 'pan') => {
    setActiveMode(mode);
    const view = viewRef.current;
    if (!view) return;
    // Dynamically import the enum value
    import('@uniview/viewer').then(({ UvEdViewMode }) => {
      view.mode = mode === 'pan' ? UvEdViewMode.PAN : UvEdViewMode.SELECTION;
    }).catch(() => { /* ignore */ });
  }, []);

  /* ── Mouse move handler — use vendor screenToWorld ── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const view = viewRef.current;
    if (!view) return;
    const container = containerRef.current;
    if (!container) return;
    try {
      const rect = container.getBoundingClientRect();
      const pt = view.screenToWorld({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setCoords({ x: pt.x, y: pt.y });
    } catch { /* ignore */ }
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      switch (e.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'f':
        case 'F':
          handleFitView();
          break;
        case 'v':
        case 'V':
          handleModeChange('select');
          break;
        case 'h':
        case 'H':
          handleModeChange('pan');
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleZoomIn, handleZoomOut, handleFitView, handleModeChange]);

  useEffect(() => {
    let cancelled = false;

    const loadAndRender = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setErrorState(null);
        setLoadingStage('detecting');

        // Brief pause so the user sees the file info on the loading screen
        await new Promise(r => setTimeout(r, 400));
        if (cancelled) return;
        setLoadingStage('engine');

        const { UvApDocManager, UvApSettingManager, UvEdOpenMode, UvEdViewMode } =
          await import('@uniview/viewer');

        if (cancelled) return;

        // Destroy existing singleton so we can recreate with current container
        if (docManagerRef.current) {
          try { await docManagerRef.current.destroy(); } catch { /* ignore cleanup errors */ }
          docManagerRef.current = null;
          viewRef.current = null;
        }

        if (cancelled) return;

        // Configure vendor settings: hide all built-in UI overlays
        const settings = UvApSettingManager.instance;
        settings.isShowCommandLine = false;
        settings.isShowCoordinate = false;
        settings.isShowEntityInfo = false;
        settings.isShowFileName = false;
        settings.isShowLanguageSelector = false;
        settings.isShowMainMenu = false;
        settings.isShowToolbar = false;
        settings.isShowAxesGizmo = false;
        settings.isShowStats = false;

        // Use Vite's base URL so paths resolve on both localhost and GitHub Pages
        const base = import.meta.env.BASE_URL ?? '/';

        // Create fresh instance attached to current container
        UvApDocManager.createInstance({
          container: containerRef.current,
          autoResize: true,
          baseUrl: base,
          fontBaseUrl: 'https://cdn.jsdelivr.net/gh/manu14357/uniview@main/demo/public/fonts/',
          webworkerFileUrls: {
            mtextRender: `${base}workers/mtext-renderer-worker.js`,
            dxfParser: `${base}workers/dxf-parser-worker.js`,
            dwgParser: `${base}workers/libredwg-parser-worker.js`,
          },
        });

        docManagerRef.current = UvApDocManager.instance;
        viewRef.current = UvApDocManager.instance.curView as UvTrView2dType;

        if (cancelled) return;
        setLoadingStage('parsing');

        // Open the document from the ArrayBuffer
        const success = await UvApDocManager.instance.openDocument(
          fileName,
          fileData,
          {
            minimumChunkSize: 1000,
            mode: UvEdOpenMode.Write,
          },
        );

        if (cancelled) return;

        if (!success) {
          handleError('Failed to open DWG file — the file may be corrupted or use an unsupported AutoCAD version.');
          return;
        }

        setLoadingStage('rendering');

        // Now that the document is open, activeLayoutView exists — safe to set mode + listen
        try {
          viewRef.current.mode = UvEdViewMode.PAN;
        } catch { /* layout not ready yet — ignore */ }

        viewRef.current.events.viewChanged.addEventListener(() => {
          const cam = viewRef.current?.activeLayoutView;
          if (cam) {
            const z = (cam as unknown as { _camera: { zoom: number } })._camera?.zoom;
            if (z != null) setZoomLevel(z);
          }
        });

        setIsLoading(false);

        // Extract real layer info from the loaded database
        const layers: CADLayer[] = [];
        try {
          const db = UvApDocManager.instance.curDocument.database;
          const layerTable = db.tables?.layerTable;
          if (layerTable) {
            const iter = layerTable.newIterator();
            for (const record of iter) {
              const rgb = record.color?.RGB;
              const hexColor = rgb !== undefined
                ? `#${rgb.toString(16).padStart(6, '0')}`
                : '#FFFFFF';
              layers.push({
                id: record.name,
                name: record.name,
                color: hexColor,
                visible: !record.isOff,
                locked: record.isLocked ?? false,
              });
            }
          }
        } catch {
          // Layer extraction failed — proceed with empty layers
        }

        const docInfo: DocumentInfo = toDocumentInfo(
          {
            entities: [],
            layers,
            bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
            blocks: {},
            units: 0,
            version: 'uniview',
          },
          fileName,
          fileData.byteLength,
        );

        useViewerStore.getState().setTotalPages(1);
        useViewerStore.getState().setDocumentInfo(docInfo);
        onLoad?.(docInfo);
        EventBus.emit('document:loaded', docInfo);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to render DWG';
        handleError(message, err);
      }
    };

    loadAndRender();

    return () => {
      cancelled = true;
      viewRef.current = null;
      if (docManagerRef.current) {
        docManagerRef.current.destroy().catch(() => {});
        docManagerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData, fileName]);

  return (
    <div
      ref={containerRef}
      className="uv-dwg-renderer h-full w-full relative"
      style={{
        backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f0f0f0',
      }}
      onMouseMove={handleMouseMove}
      role="img"
      aria-label={`DWG drawing: ${fileName}`}
    >
      {isLoading && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc' }}
          role="status"
        >
          {/* UniView logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }}>
              UniView
            </span>
          </div>

          {/* File info card */}
          <div
            className="mb-8 rounded-xl border px-6 py-4 text-center"
            style={{
              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
              borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3b82f6' }}>
              {fileName.split('.').pop()?.toUpperCase() ?? 'CAD'} File
            </p>
            <p
              className="mt-1 max-w-[280px] truncate text-sm font-medium"
              style={{ color: theme === 'dark' ? '#cbd5e1' : '#334155' }}
            >
              {fileName}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
              {(fileData.byteLength / 1024).toFixed(1)} KB
            </p>
          </div>

          {/* Loading stages */}
          <div className="flex flex-col gap-2 text-xs" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
            {[
              { key: 'detecting', label: 'Detecting file format' },
              { key: 'engine', label: 'Loading CAD engine' },
              { key: 'parsing', label: 'Parsing drawing data' },
              { key: 'rendering', label: 'Rendering geometry' },
            ].map(({ key, label }) => {
              const stages = ['detecting', 'engine', 'parsing', 'rendering'];
              const currentIdx = stages.indexOf(loadingStage);
              const stageIdx = stages.indexOf(key);
              const isDone = stageIdx < currentIdx;
              const isActive = stageIdx === currentIdx;
              return (
                <div key={key} className="flex items-center gap-2.5">
                  {isDone ? (
                    <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isActive ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-blue-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border" style={{ borderColor: theme === 'dark' ? '#334155' : '#cbd5e1' }} />
                  )}
                  <span style={{
                    color: isDone
                      ? (theme === 'dark' ? '#64748b' : '#94a3b8')
                      : isActive
                        ? (theme === 'dark' ? '#e2e8f0' : '#1e293b')
                        : undefined,
                    fontWeight: isActive ? 500 : 400,
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {errorState && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center z-10 bg-white/90 dark:bg-gray-900/90">
          <svg className="h-16 w-16 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">DWG Rendering Error</p>
          <p className="max-w-md text-sm text-gray-400 dark:text-gray-500">{errorState}</p>
          <p className="text-xs text-gray-400 dark:text-gray-600">{fileName}</p>
        </div>
      )}
      {!isLoading && !errorState && (
        <CADToolbar
          coordinates={coords}
          zoom={zoomLevel}
          activeMode={activeMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onModeChange={handleModeChange}
          onGoToCoordinates={handleGoToCoordinates}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      )}
    </div>
  );
}
