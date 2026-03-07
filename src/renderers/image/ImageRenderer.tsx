import { useEffect, useRef, useState } from 'react';
import type { RendererProps, DocumentInfo, ViewerError, SupportedFormat } from '../../core/types';
import { EventBus } from '../../core/EventBus';
import { useViewerStore } from '../../store/viewerStore';
import { usePan } from '../../hooks/usePan';

/**
 * Image Renderer — uses native Canvas API for raster images and
 * inline SVG rendering. Supports zoom, pan, and basic inspection.
 */
export default function ImageRenderer({
  fileData,
  fileName,
  theme,
  initialZoom,
  onLoad,
  onError,
}: RendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [scale, setScale] = useState(initialZoom);
  const [isLoading, setIsLoading] = useState(true);
  const { pan, panHandlers } = usePan();

  const isSVG = fileName.toLowerCase().endsWith('.svg');
  const format = (fileName.split('.').pop()?.toLowerCase() ?? 'png') as SupportedFormat;

  // Load image
  useEffect(() => {
    let cancelled = false;
    const blob = new Blob([fileData]);
    const url = URL.createObjectURL(blob);

    if (isSVG) {
      // For SVG, also capture the raw text for inline rendering
      const decoder = new TextDecoder();
      const text = decoder.decode(fileData);
      // Sanitize: remove script tags and event handlers
      const sanitized = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
      setSvgContent(sanitized);
    }

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      setIsLoading(false);

      const docInfo: DocumentInfo = {
        format,
        fileName,
        fileSize: fileData.byteLength,
        pageCount: 1,
      };
      useViewerStore.getState().setTotalPages(1);
      useViewerStore.getState().setDocumentInfo(docInfo);
      onLoad?.(docInfo);
      EventBus.emit('document:loaded', docInfo);
    };
    img.onerror = () => {
      if (cancelled) return;
      setIsLoading(false);
      const viewerError: ViewerError = {
        code: 'IMAGE_LOAD_ERROR',
        message: `Failed to load image: ${fileName}`,
        format,
        originalError: new Error('Image load failed'),
      };
      onError?.(viewerError);
      EventBus.emit('document:error', viewerError);
    };
    img.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData, fileName, isSVG, format, onLoad, onError]);

  // Draw image on canvas (for raster images)
  useEffect(() => {
    if (!image || !canvasRef.current || isSVG) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = image.naturalWidth * scale * dpr;
    canvas.height = image.naturalHeight * scale * dpr;
    canvas.style.width = `${image.naturalWidth * scale}px`;
    canvas.style.height = `${image.naturalHeight * scale}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.naturalWidth * scale, image.naturalHeight * scale);
  }, [image, scale, isSVG]);

  // Listen for zoom changes
  useEffect(() => {
    const unsub = EventBus.on('zoom:change', (zoom) => {
      if (zoom > 0) setScale(zoom);
    });
    return unsub;
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(10, scale * delta));
      setScale(newScale);
      useViewerStore.getState().setZoom(newScale);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        <span className="sr-only">Loading image...</span>
      </div>
    );
  }

  return (
    <div
      className={`uv-image-renderer flex h-full items-center justify-center overflow-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'}`}
      onWheel={handleWheel}
      {...panHandlers}
      role="img"
      aria-label={`Image: ${fileName}`}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          cursor: pan.isDragging ? 'grabbing' : 'grab',
        }}
      >
        {isSVG && svgContent ? (
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <canvas ref={canvasRef} className="block" />
        )}
      </div>
    </div>
  );
}
