import { useState, useCallback, type DragEvent } from 'react';

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  accept?: string[];
  className?: string;
}

/**
 * Drag-and-drop file area with visual feedback.
 */
export default function DropZone({ onFileDrop, accept, className = '' }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (accept && accept.length > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!accept.includes(ext) && !accept.includes(file.type)) {
          return;
        }
      }

      onFileDrop(file);
    },
    [onFileDrop, accept],
  );

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
        isDragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label="Drop file here to open"
    >
      <svg
        className={`mb-4 h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {isDragOver ? 'Drop file to open' : 'Drag & drop a file here'}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        PDF, DOCX, XLSX, DXF, DWG, images and more
      </p>
    </div>
  );
}
