import { useCallback, useRef } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { EventBus } from '../core/EventBus';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 1.25;

/**
 * Hook for zoom level management with clamping and event emission.
 */
export function useZoom() {
  const store = useViewerStore();
  const zoomRef = useRef(store.zoom);
  zoomRef.current = store.zoom;

  const setZoom = useCallback(
    (zoom: number) => {
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
      store.setZoom(clamped);
      EventBus.emit('zoom:change', clamped);
    },
    [store],
  );

  const zoomIn = useCallback(() => {
    setZoom(zoomRef.current * ZOOM_STEP);
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoomRef.current / ZOOM_STEP);
  }, [setZoom]);

  const zoomTo = useCallback(
    (level: number) => {
      setZoom(level);
    },
    [setZoom],
  );

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  const fitWidth = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  const fitPage = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  return {
    zoom: store.zoom,
    setZoom,
    zoomIn,
    zoomOut,
    zoomTo,
    resetZoom,
    fitWidth,
    fitPage,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  };
}
