import { useCallback } from 'react';
import { useViewerContext } from '../core/ViewerContext';
import { useLayerStore } from '../store/layerStore';
import { EventBus } from '../core/EventBus';

/**
 * Main viewer state hook — provides programmatic control over the viewer.
 * Must be used inside a <UniView> component tree.
 */
export function useViewer() {
  const ctx = useViewerContext();
  const layerStore = useLayerStore();

  const goToPage = useCallback(
    (page: number) => {
      ctx.goToPage(page);
    },
    [ctx],
  );

  const nextPage = useCallback(() => {
    ctx.goToPage(ctx.currentPage + 1);
  }, [ctx]);

  const prevPage = useCallback(() => {
    ctx.goToPage(ctx.currentPage - 1);
  }, [ctx]);

  const setZoom = useCallback(
    (zoom: number) => {
      ctx.setZoom(zoom);
    },
    [ctx],
  );

  const zoomIn = useCallback(() => {
    ctx.setZoom(ctx.zoom * 1.25);
  }, [ctx]);

  const zoomOut = useCallback(() => {
    ctx.setZoom(ctx.zoom / 1.25);
  }, [ctx]);

  const fitWidth = useCallback(() => {
    // Emit event that renderers can listen to for fit-width behavior
    EventBus.emit('zoom:change', -1); // Convention: -1 = fit width
  }, []);

  const fitPage = useCallback(() => {
    EventBus.emit('zoom:change', -2); // Convention: -2 = fit page
  }, []);

  const toggleLayer = useCallback(
    (layerId: string) => {
      layerStore.toggleVisibility(layerId);
      const layer = layerStore.layers.find((l) => l.id === layerId);
      if (layer) {
        EventBus.emit('layer:toggle', {
          layerId,
          visible: !layer.visible,
        });
      }
    },
    [layerStore],
  );

  return {
    /* State */
    format: ctx.format,
    fileName: ctx.fileName,
    documentInfo: ctx.documentInfo,
    isLoading: ctx.isLoading,
    error: ctx.error,
    currentPage: ctx.currentPage,
    totalPages: ctx.totalPages,
    zoom: ctx.zoom,
    theme: ctx.theme,
    layout: ctx.layout,

    /* Navigation actions */
    goToPage,
    nextPage,
    prevPage,

    /* Zoom actions */
    setZoom,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,

    /* Layer actions */
    toggleLayer,
    layers: layerStore.layers,

    /* Sidebar */
    sidebarOpen: ctx.sidebarOpen,
    toggleSidebar: ctx.toggleSidebar,
  };
}
