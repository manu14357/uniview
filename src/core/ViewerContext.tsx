import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  SupportedFormat,
  ThemeMode,
  LayoutMode,
  DocumentInfo,
  ViewerError,
} from './types';
import { useViewerStore } from '../store/viewerStore';
import { EventBus } from './EventBus';

/** Shape of the viewer context exposed to children components */
export interface ViewerContextValue {
  /* Document state */
  format: SupportedFormat | null;
  fileName: string;
  fileData: ArrayBuffer | null;
  documentInfo: DocumentInfo | null;
  isLoading: boolean;
  loadingProgress: number;
  error: ViewerError | null;

  /* Navigation */
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;

  /* Zoom */
  zoom: number;
  setZoom: (zoom: number) => void;

  /* Theme & layout */
  theme: ThemeMode;
  layout: LayoutMode;

  /* Sidebar */
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  /* Annotations */
  annotationsEnabled: boolean;
}

const ViewerCtx = createContext<ViewerContextValue | null>(null);

/** Provider component — wraps the viewer tree and provides state */
export function ViewerProvider({
  children,
  theme = 'auto',
  layout = 'continuous',
  annotations = false,
}: {
  children: ReactNode;
  theme?: ThemeMode;
  layout?: LayoutMode;
  annotations?: boolean;
}) {
  // Select individual values for reactive reads (stable references when unchanged)
  const format = useViewerStore((s) => s.format);
  const fileName = useViewerStore((s) => s.fileName);
  const fileData = useViewerStore((s) => s.fileData);
  const documentInfo = useViewerStore((s) => s.documentInfo);
  const isLoading = useViewerStore((s) => s.isLoading);
  const loadingProgress = useViewerStore((s) => s.loadingProgress);
  const error = useViewerStore((s) => s.error);
  const currentPage = useViewerStore((s) => s.currentPage);
  const totalPages = useViewerStore((s) => s.totalPages);
  const zoom = useViewerStore((s) => s.zoom);
  const storeTheme = useViewerStore((s) => s.theme);
  const storeLayout = useViewerStore((s) => s.layout);
  const sidebarOpen = useViewerStore((s) => s.sidebarOpen);

  // Sync prop-driven theme/layout into store (imperative — use getState)
  useEffect(() => {
    useViewerStore.getState().setTheme(theme);
  }, [theme]);

  useEffect(() => {
    useViewerStore.getState().setLayout(layout);
  }, [layout]);

  const goToPage = useCallback((page: number) => {
    const s = useViewerStore.getState();
    const clamped = Math.max(1, Math.min(page, s.totalPages));
    s.setCurrentPage(clamped);
    EventBus.emit('page:change', clamped);
  }, []);

  const setZoomCb = useCallback((z: number) => {
    const clamped = Math.max(0.1, Math.min(z, 10));
    useViewerStore.getState().setZoom(clamped);
    EventBus.emit('zoom:change', clamped);
  }, []);

  const toggleSidebar = useCallback(() => {
    const s = useViewerStore.getState();
    const next = !s.sidebarOpen;
    s.setSidebarOpen(next);
    EventBus.emit('sidebar:toggle', next);
  }, []);

  const value: ViewerContextValue = useMemo(
    () => ({
      format,
      fileName,
      fileData,
      documentInfo,
      isLoading,
      loadingProgress,
      error,
      currentPage,
      totalPages,
      goToPage,
      zoom,
      setZoom: setZoomCb,
      theme: storeTheme,
      layout: storeLayout,
      sidebarOpen,
      toggleSidebar,
      annotationsEnabled: annotations,
    }),
    [
      format, fileName, fileData, documentInfo, isLoading, loadingProgress,
      error, currentPage, totalPages, goToPage, zoom, setZoomCb, storeTheme,
      storeLayout, sidebarOpen, toggleSidebar, annotations,
    ],
  );

  return <ViewerCtx.Provider value={value}>{children}</ViewerCtx.Provider>;
}

/** Hook to consume viewer context — must be used inside ViewerProvider */
export function useViewerContext(): ViewerContextValue {
  const ctx = useContext(ViewerCtx);
  if (!ctx) {
    throw new Error('[UniView] useViewerContext must be used inside <ViewerProvider>');
  }
  return ctx;
}
