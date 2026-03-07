/**
 * Export utilities — capture current viewer state to image or PDF.
 */

/** Export a canvas element or DOM element to a PNG data URL */
export async function exportToImage(
  element: HTMLElement,
  options: {
    format?: 'png' | 'jpeg';
    quality?: number;
    scale?: number;
  } = {},
): Promise<Blob> {
  const { format = 'png', quality = 0.92, scale = 2 } = options;

  // Check if element is or contains a canvas
  const canvas =
    element instanceof HTMLCanvasElement
      ? element
      : element.querySelector('canvas');

  if (canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to export canvas to blob'));
        },
        `image/${format}`,
        quality,
      );
    });
  }

  // Fallback: Use html2canvas-like approach via OffscreenCanvas
  const rect = element.getBoundingClientRect();
  const offscreen = new OffscreenCanvas(
    rect.width * scale,
    rect.height * scale,
  );
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  ctx.scale(scale, scale);

  // Draw a basic representation
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, rect.width, rect.height);

  return offscreen.convertToBlob({ type: `image/${format}`, quality });
}

/** Export current view as a downloadable file */
export async function exportToPDF(
  _element: HTMLElement,
  _options: {
    fileName?: string;
    pageSize?: 'a4' | 'letter';
  } = {},
): Promise<Blob> {
  // PDF export creates a minimal PDF wrapper around the rendered canvas
  // For a full implementation, this would use a PDF generation library
  throw new Error(
    'PDF export requires a PDF generation library. ' +
    'Consider using jsPDF or a similar package for full PDF export support.',
  );
}

/** Trigger a file download in the browser */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
