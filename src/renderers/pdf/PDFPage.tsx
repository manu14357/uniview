import { useEffect, useRef, useState, memo } from 'react';
import type { PDFPageData } from './pdf.types';

interface PDFPageProps {
  pageNumber: number;
  pageData: PDFPageData;
  scale: number;
  rotation: number;
  isVisible: boolean;
  pdfDocument: unknown; // pdfjs-dist PDFDocumentProxy
  onRenderComplete?: (pageNumber: number) => void;
}

/**
 * Individual PDF page component.
 * Each page is an independent canvas element. Only renders when visible
 * (controlled by IntersectionObserver in the parent PDFRenderer).
 */
const PDFPage = memo(function PDFPage({
  pageNumber,
  pageData,
  scale,
  rotation,
  isVisible,
  pdfDocument,
  onRenderComplete,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (!isVisible || !pdfDocument || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        // Cancel any previous render
        renderTaskRef.current?.cancel();

        const doc = pdfDocument as {
          getPage: (num: number) => Promise<{
            getViewport: (opts: { scale: number; rotation: number }) => {
              width: number;
              height: number;
            };
            render: (opts: {
              canvasContext: CanvasRenderingContext2D;
              viewport: { width: number; height: number };
            }) => { promise: Promise<void>; cancel: () => void };
          }>;
        };

        const page = await doc.getPage(pageNumber);
        if (cancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const totalRotation = (pageData.rotation + rotation) % 360;
        const viewport = page.getViewport({ scale: scale * dpr, rotation: totalRotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (!cancelled) {
          setIsRendered(true);
          onRenderComplete?.(pageNumber);
        }
      } catch (err) {
        if (!cancelled && err instanceof Error && err.message !== 'Rendering cancelled') {
          // Silently handle cancelled renders
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [isVisible, pdfDocument, pageNumber, scale, rotation, pageData.rotation, onRenderComplete]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const totalRotation = (pageData.rotation + rotation) % 360;
  const isRotated90 = totalRotation === 90 || totalRotation === 270;
  const displayWidth = isRotated90 ? pageData.height * scale : pageData.width * scale;
  const displayHeight = isRotated90 ? pageData.width * scale : pageData.height * scale;

  return (
    <div
      className="uv-pdf-page relative mx-auto mb-2 bg-white shadow-md"
      data-page={pageNumber}
      style={{
        width: displayWidth,
        height: displayHeight,
      }}
      role="img"
      aria-label={`Page ${pageNumber}`}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: displayWidth,
          height: displayHeight,
        }}
      />
      {!isRendered && isVisible && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-50"
          aria-hidden="true"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}
      {!isVisible && (
        <div
          className="absolute inset-0 bg-gray-100"
          style={{ width: displayWidth / dpr, height: displayHeight / dpr }}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

export default PDFPage;
