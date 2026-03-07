import { useViewerStore } from '../../store/viewerStore';
import { useViewer } from '../../hooks/useViewer';

/**
 * Page thumbnail strip — shows miniature page previews for PDF documents.
 */
export default function ThumbnailPanel() {
  const totalPages = useViewerStore((s) => s.totalPages);
  const currentPage = useViewerStore((s) => s.currentPage);
  const { goToPage } = useViewer();

  if (totalPages <= 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3" role="listbox" aria-label="Page thumbnails">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => goToPage(pageNum)}
          className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
            currentPage === pageNum
              ? 'bg-blue-100 ring-2 ring-blue-500 dark:bg-blue-900/30'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          role="option"
          aria-selected={currentPage === pageNum}
          aria-label={`Page ${pageNum}`}
        >
          <div className="flex h-24 w-full items-center justify-center rounded border border-gray-200 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800">
            <span className="text-lg font-medium">{pageNum}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{pageNum}</span>
        </button>
      ))}
    </div>
  );
}
