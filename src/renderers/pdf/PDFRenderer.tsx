import { useEffect, useRef, useState, useCallback } from 'react';
import type { RendererProps, DocumentInfo, ViewerError } from '../../core/types';
import type { PDFPageData, PDFDocumentData } from './pdf.types';
import { toDocumentInfo } from './pdf.types';
import PDFPage from './PDFPage';
import { EventBus } from '../../core/EventBus';
import { useViewerStore } from '../../store/viewerStore';

/**
 * PDF Renderer — uses PDF.js with canvas rendering and virtual page scrolling.
 * Only pages visible in the viewport are rendered (IntersectionObserver).
 * Pre-renders 1 page ahead/behind the current view.
 */
export default function PDFRenderer({
  fileData,
  fileName,
  theme,
  initialPage,
  initialZoom,
  onLoad,
  onError,
  onPageChange,
}: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<unknown>(null);
  const [docData, setDocData] = useState<PDFDocumentData | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([initialPage]));
  const [scale, setScale] = useState(initialZoom);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [rotation, setRotation] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Load PDF.js and parse document
  useEffect(() => {
    let cancelled = false;

    const loadPDF = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const loadingTask = pdfjsLib.getDocument({ data: fileData.slice(0) });
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        // Extract page info
        const pages: PDFPageData[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          pages.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,
            rotation: page.rotate,
          });
        }

        const metadata = await pdf.getMetadata().catch(() => null);
        const info = metadata?.info as Record<string, string> | undefined;

        const data: PDFDocumentData = {
          pageCount: pdf.numPages,
          title: info?.Title,
          author: info?.Author,
          creator: info?.Creator,
          producer: info?.Producer,
          creationDate: info?.CreationDate,
          modDate: info?.ModDate,
          pages,
        };

        if (cancelled) return;

        setPdfDocument(pdf);
        setDocData(data);

        const docInfo: DocumentInfo = toDocumentInfo(data, fileName, fileData.byteLength);
        useViewerStore.getState().setTotalPages(pdf.numPages);
        useViewerStore.getState().setDocumentInfo(docInfo);
        onLoad?.(docInfo);
        EventBus.emit('document:loaded', docInfo);
      } catch (err) {
        if (cancelled) return;
        const viewerError: ViewerError = {
          code: 'PDF_PARSE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to parse PDF',
          format: 'pdf',
          originalError: err instanceof Error ? err : undefined,
        };
        onError?.(viewerError);
        EventBus.emit('document:error', viewerError);
      }
    };

    loadPDF();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData, fileName, onLoad, onError]);

  // IntersectionObserver for virtual page rendering
  useEffect(() => {
    if (!containerRef.current || !docData) return;

    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const pageNum = parseInt(
              (entry.target as HTMLElement).dataset.page ?? '0',
              10,
            );
            if (pageNum === 0) continue;

            if (entry.isIntersecting) {
              next.add(pageNum);
              // Pre-render adjacent pages
              if (pageNum > 1) next.add(pageNum - 1);
              if (pageNum < docData.pageCount) next.add(pageNum + 1);
            }
          }
          return next;
        });
      },
      {
        root: containerRef.current,
        rootMargin: '200px 0px',
        threshold: 0.01,
      },
    );

    observerRef.current = observer;

    // Observe all page containers
    const pageElements = containerRef.current.querySelectorAll('[data-page]');
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [docData]);

  // Track current page on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !docData) return;

    const handleScroll = () => {
      const pages = container.querySelectorAll('[data-page]');
      const containerRect = container.getBoundingClientRect();
      const containerMiddle = containerRect.top + containerRect.height / 2;

      let closestPage = currentPage;
      let closestDist = Infinity;

      pages.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const pageMiddle = rect.top + rect.height / 2;
        const dist = Math.abs(pageMiddle - containerMiddle);
        if (dist < closestDist) {
          closestDist = dist;
          closestPage = parseInt((el as HTMLElement).dataset.page ?? '1', 10);
        }
      });

      if (closestPage !== currentPage) {
        setCurrentPage(closestPage);
        useViewerStore.getState().setCurrentPage(closestPage);
        onPageChange?.(closestPage);
        EventBus.emit('page:change', closestPage);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docData, currentPage, onPageChange]);

  // Listen for zoom changes
  useEffect(() => {
    const unsub = EventBus.on('zoom:change', (zoom) => {
      if (zoom > 0) {
        setScale(zoom);
      }
    });
    return unsub;
  }, []);

  // Listen for rotation changes
  useEffect(() => {
    const unsub = EventBus.on('rotation:change', (deg) => {
      setRotation(deg);
    });
    return unsub;
  }, []);

  // Listen for page navigation events
  useEffect(() => {
    const unsub = EventBus.on('page:change', (page) => {
      if (containerRef.current) {
        const pageEl = containerRef.current.querySelector(`[data-page="${page}"]`);
        pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return unsub;
  }, []);

  const handleRenderComplete = useCallback((_pageNumber: number) => {
    // Could track which pages are rendered for analytics/progress
  }, []);

  if (!docData || !pdfDocument) {
    return (
      <div className="flex h-full items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        <span className="sr-only">Loading PDF...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`uv-pdf-renderer h-full overflow-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'}`}
      style={{ padding: '16px' }}
      role="document"
      aria-label={`PDF document: ${fileName}`}
    >
      {docData.pages.map((pageData) => (
        <PDFPage
          key={pageData.pageNumber}
          pageNumber={pageData.pageNumber}
          pageData={pageData}
          scale={scale}
          rotation={rotation}
          isVisible={visiblePages.has(pageData.pageNumber)}
          pdfDocument={pdfDocument}
          onRenderComplete={handleRenderComplete}
        />
      ))}
    </div>
  );
}
