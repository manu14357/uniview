import { create } from 'zustand';
import type {
  SupportedFormat,
  ThemeMode,
  LayoutMode,
  DocumentInfo,
  ViewerError,
} from '../core/types';

export interface ViewerStoreState {
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

  /* Zoom */
  zoom: number;

  /* Rotation (0, 90, 180, 270) */
  rotation: number;

  /* Theme & layout */
  theme: ThemeMode;
  layout: LayoutMode;

  /* Sidebar */
  sidebarOpen: boolean;

  /* Actions */
  setFormat: (format: SupportedFormat | null) => void;
  setFileName: (name: string) => void;
  setFileData: (data: ArrayBuffer | null) => void;
  setDocumentInfo: (info: DocumentInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: ViewerError | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setLayout: (layout: LayoutMode) => void;
  setSidebarOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  format: null as SupportedFormat | null,
  fileName: '',
  fileData: null as ArrayBuffer | null,
  documentInfo: null as DocumentInfo | null,
  isLoading: false,
  loadingProgress: 0,
  error: null as ViewerError | null,
  currentPage: 1,
  totalPages: 0,
  zoom: 1,
  rotation: 0,
  theme: 'auto' as ThemeMode,
  layout: 'continuous' as LayoutMode,
  sidebarOpen: false,
};

export const useViewerStore = create<ViewerStoreState>((set) => ({
  ...initialState,

  setFormat: (format) => set({ format }),
  setFileName: (fileName) => set({ fileName }),
  setFileData: (fileData) => set({ fileData }),
  setDocumentInfo: (documentInfo) => set({ documentInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
  setError: (error) => set({ error }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
  setZoom: (zoom) => set({ zoom }),
  setRotation: (rotation) => set({ rotation: ((rotation % 360) + 360) % 360 }),
  setTheme: (theme) => set({ theme }),
  setLayout: (layout) => set({ layout }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  reset: () => set(initialState),
}));
