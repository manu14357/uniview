import { useEffect, useRef, useState, useCallback } from 'react';
import type { RendererProps, DocumentInfo, CADLayer, ViewerError, ExportOptions } from '../../core/types';
import { toDocumentInfo } from './dwg.types';
import { EventBus } from '../../core/EventBus';
import { useViewerStore } from '../../store/viewerStore';
import { checkDWGVersion } from '../../utils/dwgVersionCheck';
import { showToast } from '../../ui/common/Toast';
import CADToolbar from '../../ui/toolbar/CADToolbar';
import type { CADCoordinates } from '../../ui/toolbar/CADToolbar';
import ExportDialog from '../../ui/common/ExportDialog';
import { exportCAD, downloadExportResult } from '../../utils/cadExportUtils';
import type { DwgExportContext } from '../../utils/cadExportUtils';
import type {
  UvApDocManager as UvApDocManagerType,
  UvTrView2d as UvTrView2dType,
} from '@uniview/viewer';
import { uvdbHostApplicationServices } from '@uniview/data-model';

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
  const [dwgVersionLabel, setDwgVersionLabel] = useState<string | null>(null);
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  // CAD toolbar state
  const [coords, setCoords] = useState<CADCoordinates>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeMode, setActiveMode] = useState<'select' | 'pan'>('pan');

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  /* ── Export handler ── */
  const handleExport = useCallback(async (options: ExportOptions) => {
    const view = viewRef.current;
    if (!view) return;

    setIsExporting(true);
    try {
      const context: DwgExportContext = {
        type: 'dwg',
        view: view as unknown as DwgExportContext['view'],
      };

      const result = await exportCAD(context, options);
      downloadExportResult(result);
      EventBus.emit('export:complete', result);
      setShowExportDialog(false);
    } catch (err) {
      const viewerError: ViewerError = {
        code: 'EXPORT_ERROR',
        message: err instanceof Error ? err.message : 'Export failed',
        format: 'dwg',
        originalError: err instanceof Error ? err : undefined,
      };
      EventBus.emit('export:error', viewerError);
      console.error('[DWG Export]', err);
    } finally {
      setIsExporting(false);
    }
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
        setIsSlowLoad(false);
        setLoadingStage('detecting');

        // DWG version pre-check — fail fast before loading WASM for unsupported versions
        const versionInfo = checkDWGVersion(fileData);
        if (versionInfo) {
          setDwgVersionLabel(versionInfo.label);
          if (!versionInfo.supported) {
            handleError(
              `This DWG file uses ${versionInfo.label} format (${versionInfo.code}), which is not yet supported. ` +
              `Please re-save the drawing as AutoCAD 2018 (AC1032) or earlier.`
            );
            return;
          }
        }

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
            mtextRender: `${base}workers/mtext-renderer-worker.js?v=${__UNIVIEW_CACHE_BUST__}`,
            dxfParser: `${base}workers/dxf-parser-worker.js?v=${__UNIVIEW_CACHE_BUST__}`,
            dwgParser: `${base}workers/libredwg-parser-worker.js?v=${__UNIVIEW_CACHE_BUST__}`,
          },
        });

        docManagerRef.current = UvApDocManager.instance;
        viewRef.current = UvApDocManager.instance.curView as UvTrView2dType;

        // Suppress the vendor's built-in progress spinner — we use our own React loading UI
        try {
          const mgr = UvApDocManager.instance as unknown as Record<string, unknown>;
          const progress = mgr._progress as { hide: () => void; destroy: () => void } | undefined;
          if (progress) {
            progress.hide();
            progress.destroy();
          }
          // Neuter updateProgress so the vendor can never re-show its spinner
          mgr.updateProgress = () => {};
        } catch { /* ignore if not accessible */ }

        if (cancelled) return;
        setLoadingStage('parsing');

        // Show a "taking longer than usual" hint after 10 seconds
        const slowTimer = setTimeout(() => {
          if (!cancelled) setIsSlowLoad(true);
        }, 10_000);

        // Intercept console.warn to:
        //  1. Detect error code 68 (partial parse — file still renders)
        //  2. Suppress noisy viewport-ID assignment messages from the vendor
        let gotErrorCode68 = false;
        const origWarn = console.warn;
        const origError = console.error;
        const interceptWarn = (...args: unknown[]) => {
          const msg = args.join(' ');
          if (msg.includes('Viewport id for handle')) return; // suppress
          origWarn.apply(console, args);
        };
        const interceptError = (...args: unknown[]) => {
          const msg = args.join(' ');
          if (msg.includes('error code') && msg.includes('68')) {
            gotErrorCode68 = true;
            return; // suppress raw message; we'll show a toast instead
          }
          origError.apply(console, args);
        };
        console.warn = interceptWarn;
        console.error = interceptError;

        let openDocSuccess = false;
        try {
          // Race the openDocument call against a 45-second timeout
          openDocSuccess = await Promise.race<boolean>([
            UvApDocManager.instance.openDocument(
              fileName,
              fileData,
              { minimumChunkSize: 1000, mode: UvEdOpenMode.Write },
            ),
            new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error('DWG parsing timed out after 45 seconds. The file may be too large or the drawing engine failed to start.')), 45_000)
            ),
          ]);
        } finally {
          console.warn = origWarn;
          console.error = origError;
          clearTimeout(slowTimer);
          setIsSlowLoad(false);
        }

        const success = openDocSuccess;

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
            if (z != null && isFinite(z) && z > 0) {
              setZoomLevel(z);
            }
          }
        });

        setIsLoading(false);

        // Post-load: if model space is empty (all content lives in paper space layout
        // sheets), automatically switch to the first non-Model layout so the drawing
        // is visible. This is the normal case for sheet-based DWG workflows.
        try {
          const layoutManager = uvdbHostApplicationServices().layoutManager;
          const db = UvApDocManager.instance.curDocument.database;

          // Count entities in model space
          let modelSpaceEntityCount = 0;
          try {
            const ms = db.tables?.blockTable?.modelSpace;
            if (ms) {
              for (const _ of (ms as unknown as { newIterator(): Iterable<unknown> }).newIterator()) {
                modelSpaceEntityCount++;
              }
            }
          } catch { /* ignore */ }

          console.log('[DWG] modelSpaceEntityCount:', modelSpaceEntityCount, '| gotErrorCode68:', gotErrorCode68);

          // Dump all block table records and their entity counts (main-thread, always visible)
          try {
            const blockTable = (db as any).tables?.blockTable;
            if (blockTable) {
              const iter = blockTable.newIterator?.();
              if (iter) {
                for (const btr of iter) {
                  let count = 0;
                  const typeNames: string[] = [];
                  try {
                    for (const e of (btr as any).newIterator()) {
                      count++;
                      const tn = (e as any).typeName ?? (e as any).constructor?.name ?? 'unknown';
                      if (!typeNames.includes(tn)) typeNames.push(tn);
                    }
                  } catch { /* ignore per-block errors */ }
                  console.log(`[DWG] Block "${(btr as any).name}": ${count} entities [${typeNames.join(', ')}]`);
                }
              }
            }
          } catch { /* ignore block dump errors */ }

          if (modelSpaceEntityCount === 0) {
            // Model space is empty — switch to the first paper space layout so the
            // drawing sheet annotations and viewport frames are at least visible.
            if (gotErrorCode68) {
              // Error 68 means some entity types couldn't be parsed by libredwg.
              // Combined with an empty model space this typically means the drawing
              // content (geometry, hatching, dimensions) uses entity types the
              // open-source parser cannot read.  Autodesk Viewer works because it
              // uses its own proprietary reader.
              setTimeout(() => showToast(
                'Some drawing entities use unsupported formats — model space content is unavailable. Showing paper space layout only.',
                'warning'
              ), 300);
            }

            // Find all paper space layouts sorted by tabOrder, pick the first one
            type LayoutEntry = { layoutName: string; tabOrder: number; blockTableRecordId: string };
            const paperLayouts: LayoutEntry[] = [];
            const layoutDict = db.objects?.layout;
            if (layoutDict) {
              const iter = (layoutDict as unknown as { newIterator(): Iterable<unknown> }).newIterator();
              for (const entry of iter) {
                const lay = entry as unknown as LayoutEntry;
                // tabOrder 0 = Model, >0 = paper space sheets
                if (lay.tabOrder > 0 && lay.layoutName) {
                  paperLayouts.push(lay);
                }
              }
            }
            paperLayouts.sort((a, b) => a.tabOrder - b.tabOrder);

            if (paperLayouts.length > 0) {
              // Switch to the first paper layout — this fires layoutSwitched which
              // triggers loadLayoutEntitiesIfNeeded in the view.
              const first = paperLayouts[0];
              layoutManager.setCurrentLayout(first.layoutName);
              // Zoom to fit the paper space content once all entities are processed.
              // zoomToFitDrawing() uses a condition waiter so it automatically waits
              // for async batchConvert to finish before zooming.
              viewRef.current?.zoomToFitDrawing();
            } else {
              // No layouts found — just refit whatever is in the scene
              viewRef.current?.zoomToFitDrawing();
            }
          } else {
            // Model space has entities — show them and fit the view.
            if (gotErrorCode68) {
              setTimeout(() => showToast(
                'Some drawing entities could not be fully parsed — showing partial render.',
                'warning'
              ), 300);
            }
            viewRef.current?.zoomToFitDrawing();
          }
        } catch { /* ignore */ }

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

    // Expose a cancel function for the loading UI cancel button
    cancelRef.current = () => { cancelled = true; };

    return () => {
      cancelled = true;
      cancelRef.current = null;
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
      role="region"
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
            {dwgVersionLabel && (
              <p className="mt-1 text-xs" style={{ color: theme === 'dark' ? '#475569' : '#94a3b8' }}>
                {dwgVersionLabel}
              </p>
            )}
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

          {/* Slow-load hint + cancel button */}
          {isSlowLoad && (
            <p className="mt-4 text-xs" style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
              Large file — still processing…
            </p>
          )}
          {(loadingStage === 'parsing' || loadingStage === 'engine') && (
            <button
              className="mt-5 rounded-md border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                color: theme === 'dark' ? '#94a3b8' : '#64748b',
              }}
              onClick={() => {
                cancelRef.current?.();
                handleError('Loading cancelled.');
              }}
            >
              Cancel
            </button>
          )}
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
          onExport={() => setShowExportDialog(true)}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      )}
      {showExportDialog && (
        <ExportDialog
          sourceFormat="dwg"
          fileName={fileName}
          onExport={handleExport}
          onClose={() => setShowExportDialog(false)}
          isExporting={isExporting}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      )}
    </div>
  );
}
