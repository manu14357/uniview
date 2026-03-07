import { useCallback, useEffect, useRef, useState } from 'react';
import { useViewerStore } from '../store/viewerStore';
import { detectFormat } from '../utils/fileDetector';
import type { SupportedFormat, ViewerError } from '../core/types';

interface FileLoaderState {
  isLoading: boolean;
  progress: number;
  error: ViewerError | null;
  fileData: ArrayBuffer | null;
  format: SupportedFormat | null;
  fileName: string;
}

/**
 * Hook for loading files from various sources (File, URL, ArrayBuffer)
 * into an ArrayBuffer suitable for renderers, with progress tracking.
 */
export function useFileLoader() {
  const store = useViewerStore();
  const [state, setState] = useState<FileLoaderState>({
    isLoading: false,
    progress: 0,
    error: null,
    fileData: null,
    format: null,
    fileName: '',
  });
  const abortRef = useRef<AbortController | null>(null);

  const loadFile = useCallback(
    async (
      file: File | string | ArrayBuffer,
      formatHint?: SupportedFormat,
    ) => {
      // Cancel any in-progress load
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        isLoading: true,
        progress: 0,
        error: null,
        fileData: null,
        format: null,
        fileName: '',
      });
      store.setLoading(true);
      store.setError(null);

      try {
        let buffer: ArrayBuffer;
        let name = '';
        const format = detectFormat(file, formatHint);

        if (!format) {
          throw new Error('Unable to detect file format. Please specify the format explicitly.');
        }

        if (file instanceof File) {
          name = file.name;
          setState((s) => ({ ...s, progress: 0.1 }));
          store.setLoadingProgress(0.1);
          buffer = await file.arrayBuffer();
        } else if (typeof file === 'string') {
          name = file.split('/').pop()?.split('?')[0] ?? 'document';
          const response = await fetch(file, { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }

          const contentLength = response.headers.get('content-length');
          const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

          if (response.body && totalSize > 0) {
            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let received = 0;

            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              if (controller.signal.aborted) throw new Error('Load cancelled');
              chunks.push(value);
              received += value.length;
              const progress = received / totalSize;
              setState((s) => ({ ...s, progress }));
              store.setLoadingProgress(progress);
            }

            const combined = new Uint8Array(received);
            let offset = 0;
            for (const chunk of chunks) {
              combined.set(chunk, offset);
              offset += chunk.length;
            }
            buffer = combined.buffer;
          } else {
            setState((s) => ({ ...s, progress: 0.5 }));
            store.setLoadingProgress(0.5);
            buffer = await response.arrayBuffer();
          }
        } else {
          // ArrayBuffer directly
          name = 'document';
          buffer = file;
        }

        if (controller.signal.aborted) return;

        const finalState: FileLoaderState = {
          isLoading: false,
          progress: 1,
          error: null,
          fileData: buffer,
          format,
          fileName: name,
        };

        setState(finalState);
        store.setFileData(buffer);
        store.setFormat(format);
        store.setFileName(name);
        store.setLoading(false);
        store.setLoadingProgress(1);
      } catch (err) {
        if (controller.signal.aborted) return;

        const viewerError: ViewerError = {
          code: 'LOAD_ERROR',
          message: err instanceof Error ? err.message : 'Failed to load file',
          originalError: err instanceof Error ? err : undefined,
        };

        setState({
          isLoading: false,
          progress: 0,
          error: viewerError,
          fileData: null,
          format: null,
          fileName: '',
        });
        store.setError(viewerError);
        store.setLoading(false);
      }
    },
    [store],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isLoading: false, progress: 0 }));
    store.setLoading(false);
  }, [store]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    ...state,
    loadFile,
    cancel,
  };
}
