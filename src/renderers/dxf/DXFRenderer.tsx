import { useEffect, useRef, useState, useCallback } from 'react';
import type { RendererProps, DocumentInfo, ViewerError, CADLayer } from '../../core/types';
import { toDocumentInfo } from './dxf.types';
import { EventBus } from '../../core/EventBus';
import { useViewerStore } from '../../store/viewerStore';
import { useLayerStore } from '../../store/layerStore';
import CADToolbar from '../../ui/toolbar/CADToolbar';
import type { CADCoordinates } from '../../ui/toolbar/CADToolbar';
import type { DxfViewer as DxfViewerType } from 'dxf-viewer';
import type { Color } from 'three';

/**
 * DXF Renderer — uses the dxf-viewer package which internally uses Three.js WebGL.
 * Supports all entity types: LINE, CIRCLE, ARC, LWPOLYLINE, SPLINE, ELLIPSE,
 * INSERT, TEXT, MTEXT, DIMENSION, HATCH, and more.
 *
 * Features:
 * - Scroll-wheel zoom centered on cursor
 * - Middle-click or Space+drag to pan
 * - Toolbar buttons for zoom in/out/fit
 * - Live X/Y coordinate display in world units
 * - Coordinate input field to navigate to a position
 */
export default function DXFRenderer({
  fileData,
  fileName,
  theme,
  onLoad,
  onError,
}: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<DxfViewerType | null>(null);
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<'detecting' | 'engine' | 'parsing' | 'rendering'>('detecting');
  const [loadProgress, setLoadProgress] = useState(0);

  // CAD toolbar state
  const [coords, setCoords] = useState<CADCoordinates>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeMode, setActiveMode] = useState<'select' | 'pan'>('pan');

  /** Read the zoom level from the camera and update state */
  const syncZoom = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const cam = viewer.GetCamera();
    if (!cam) return;
    const bounds = boundsRef.current;
    if (!bounds) return;
    // Compute zoom as ratio of drawing width to camera view width
    const drawingWidth = bounds.maxX - bounds.minX;
    if (drawingWidth <= 0) return;
    const camWidth = cam.right - cam.left;
    if (camWidth <= 0) return;
    setZoomLevel(drawingWidth / camWidth);
  }, []);

  /** Convert screen (pixel) position to world coordinates */
  const screenToWorld = useCallback((clientX: number, clientY: number): CADCoordinates | null => {
    const viewer = viewerRef.current;
    const container = canvasWrapRef.current;
    if (!viewer || !container) return null;
    const cam = viewer.GetCamera();
    if (!cam) return null;
    const rect = container.getBoundingClientRect();
    // Normalise to [-1, 1]
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    // Map to camera frustum
    const worldX = cam.left + (ndcX + 1) / 2 * (cam.right - cam.left);
    const worldY = cam.bottom + (ndcY + 1) / 2 * (cam.top - cam.bottom);
    return { x: worldX, y: worldY };
  }, []);

  /* ── Zoom helpers ── */
  const handleZoomIn = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const cam = viewer.GetCamera();
    if (!cam) return;
    const center = cam.position;
    const currentWidth = cam.right - cam.left;
    viewer.SetView(center, currentWidth / 1.3);
    viewer.Render();
    syncZoom();
  }, [syncZoom]);

  const handleZoomOut = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const cam = viewer.GetCamera();
    if (!cam) return;
    const center = cam.position;
    const currentWidth = cam.right - cam.left;
    viewer.SetView(center, currentWidth * 1.3);
    viewer.Render();
    syncZoom();
  }, [syncZoom]);

  const handleFitView = useCallback(() => {
    const viewer = viewerRef.current;
    const bounds = boundsRef.current;
    if (!viewer || !bounds) return;
    viewer.FitView(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, 0.1);
    viewer.Render();
    syncZoom();
  }, [syncZoom]);

  const handleGoToCoordinates = useCallback((target: CADCoordinates) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const cam = viewer.GetCamera();
    if (!cam) return;
    // Keep the current zoom width, just re-center
    const currentWidth = cam.right - cam.left;
    // Build a temporary Vector3 for the center
    const center = cam.position.clone();
    center.x = target.x;
    center.y = target.y;
    viewer.SetView(center, currentWidth);
    viewer.Render();
    syncZoom();
  }, [syncZoom]);

  const handleLayerToggle = useCallback(({ layerId, visible }: { layerId: string; visible: boolean }) => {
    viewerRef.current?.ShowLayer(layerId, visible);
  }, []);

  /* ── Mouse move handler for live coordinates ── */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const world = screenToWorld(e.clientX, e.clientY);
      if (world) setCoords(world);
    },
    [screenToWorld],
  );

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
          setActiveMode('select');
          break;
        case 'h':
        case 'H':
          setActiveMode('pan');
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleZoomIn, handleZoomOut, handleFitView]);

  /* ── Main load effect ── */
  useEffect(() => {
    if (!canvasWrapRef.current) return;
    let cancelled = false;

    const loadAndRender = async () => {
      try {
        setLoadingStage('engine');

        const { DxfViewer } = await import('dxf-viewer');

        if (cancelled || !canvasWrapRef.current) return;

        const container = canvasWrapRef.current;

        // Create DxfViewer instance
        const clearHex = theme === 'dark' ? 0x1a1a2e : 0xf0f0f0;
        // Duck-typed Three.Color to avoid importing a second Three.js instance.
        // dxf-viewer calls .getHex() and passes this to renderer.setClearColor()
        // which checks .isColor and reads .r/.g/.b.
        const clearColor = {
          isColor: true,
          r: ((clearHex >> 16) & 0xff) / 255,
          g: ((clearHex >> 8) & 0xff) / 255,
          b: (clearHex & 0xff) / 255,
          getHex() { return clearHex; },
        };
        const viewer = new DxfViewer(container, {
          clearColor: clearColor as unknown as Color,
          autoResize: true,
          antialias: true,
          colorCorrection: true,
          blackWhiteInversion: theme === 'dark',
          sceneOptions: {
            wireframeMesh: true,
          },
        });
        viewerRef.current = viewer;

        if (cancelled) {
          viewer.Destroy();
          return;
        }

        setLoadingStage('parsing');

        // Create a blob URL from the fileData
        const blob = new Blob([fileData], { type: 'application/dxf' });
        const blobUrl = URL.createObjectURL(blob);

        try {
          await viewer.Load({
            url: blobUrl,
            fonts: null,
            progressCbk: (phase, processedSize, totalSize) => {
              if (cancelled) return;
              if (phase === 'prepare' || phase === 'font') {
                setLoadingStage('rendering');
              }
              if (totalSize > 0) {
                setLoadProgress(processedSize / totalSize);
              }
            },
            workerFactory: null,
          });
        } finally {
          URL.revokeObjectURL(blobUrl);
        }

        if (cancelled) {
          viewer.Destroy();
          return;
        }

        // Store bounds for zoom helpers
        const bounds = viewer.GetBounds();
        if (bounds) {
          boundsRef.current = bounds;
        }

        // Subscribe to view changes (zoom/pan via mouse) to keep toolbar in sync
        const onViewChanged = () => {
          syncZoom();
        };
        viewer.Subscribe('viewChanged', onViewChanged);

        // Extract layers from the viewer
        const layers: CADLayer[] = [];
        for (const layerInfo of viewer.GetLayers()) {
          layers.push({
            id: layerInfo.name,
            name: layerInfo.displayName || layerInfo.name,
            color: '#' + (layerInfo.color & 0xFFFFFF).toString(16).padStart(6, '0'),
            visible: true,
            locked: false,
          });
        }

        useLayerStore.getState().setLayers(layers);

        // Listen for layer toggle events
        const unsubLayer = EventBus.on('layer:toggle', handleLayerToggle);

        setIsLoading(false);

        // Auto-fit the drawing to fill the viewport.
        // Use requestAnimationFrame so the loading overlay is removed first and
        // the container has its final dimensions.
        requestAnimationFrame(() => {
          if (cancelled || !viewerRef.current) return;
          if (boundsRef.current) {
            viewerRef.current.FitView(
              boundsRef.current.minX,
              boundsRef.current.maxX,
              boundsRef.current.minY,
              boundsRef.current.maxY,
              0.1,
            );
            viewerRef.current.Render();
          }
          syncZoom();
        });

        const docInfo: DocumentInfo = toDocumentInfo(
          {
            entities: [],
            layers,
            bounds: bounds
              ? { minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY }
              : { minX: 0, minY: 0, maxX: 100, maxY: 100 },
            blocks: {},
            units: 0,
          },
          fileName,
          fileData.byteLength,
        );
        useViewerStore.getState().setTotalPages(1);
        useViewerStore.getState().setDocumentInfo(docInfo);
        onLoad?.(docInfo);
        EventBus.emit('document:loaded', docInfo);

        return () => {
          viewer.Unsubscribe('viewChanged', onViewChanged);
          unsubLayer();
        };
      } catch (err) {
        if (cancelled) return;
        setIsLoading(false);
        const viewerError: ViewerError = {
          code: 'DXF_RENDER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to render DXF',
          format: 'dxf',
          originalError: err instanceof Error ? err : undefined,
        };
        onError?.(viewerError);
        EventBus.emit('document:error', viewerError);
      }
    };

    let unsubFn: (() => void) | undefined;
    loadAndRender().then((unsub) => {
      unsubFn = unsub;
    });

    return () => {
      cancelled = true;
      unsubFn?.();
      if (viewerRef.current) {
        viewerRef.current.Destroy();
        viewerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData, fileName, theme, onLoad, onError]);

  // Re-fit after resize events — dxf-viewer's autoResize handles canvas sizing,
  // but we also re-fit the view so the drawing stays centered.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || isLoading) return;

    const onResized = () => {
      const bounds = boundsRef.current;
      if (bounds) {
        viewer.FitView(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, 0.1);
      }
      viewer.Render();
    };
    viewer.Subscribe('resized', onResized);
    return () => { try { viewer.Unsubscribe('resized', onResized); } catch { /* destroyed */ } };
  }, [isLoading]);

  return (
    <div
      ref={containerRef}
      className="uv-dxf-renderer relative h-full w-full"
      style={{ cursor: activeMode === 'pan' ? 'grab' : 'default' }}
      onMouseMove={handleMouseMove}
      role="img"
      aria-label={`DXF drawing: ${fileName}`}
    >
      {/* Three.js canvas mounts here — always in DOM so ref is available for init.
          Wrapper uses absolute+inset-0 for sizing. canvasWrapRef uses w-full h-full
          because dxf-viewer overrides position to "relative" via inline style, which
          would break absolute positioning on the ref element itself. */}
      <div className="absolute inset-0">
        <div ref={canvasWrapRef} className="h-full w-full" />
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
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

          {/* Progress bar */}
          {loadProgress > 0 && loadProgress < 1 && (
            <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full" style={{ backgroundColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${loadProgress * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* CAD floating toolbar — visible when loaded */}
      {!isLoading && (
        <CADToolbar
          coordinates={coords}
          zoom={zoomLevel}
          activeMode={activeMode}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onModeChange={setActiveMode}
          onGoToCoordinates={handleGoToCoordinates}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      )}
    </div>
  );
}
