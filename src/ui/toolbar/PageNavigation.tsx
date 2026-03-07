import { useState } from 'react';
import { useViewerStore } from '../../store/viewerStore';
import { useViewer } from '../../hooks/useViewer';

/**
 * Page navigation — prev, page input, next, total for paginated documents.
 */
export default function PageNavigation() {
  const currentPage = useViewerStore((s) => s.currentPage);
  const totalPages = useViewerStore((s) => s.totalPages);
  const { goToPage, nextPage, prevPage } = useViewer();
  const [inputValue, setInputValue] = useState('');

  if (totalPages <= 1) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputValue, 10);
    if (page >= 1 && page <= totalPages) {
      goToPage(page);
    }
    setInputValue('');
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={prevPage}
        disabled={currentPage <= 1}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Previous page"
        title="Previous page"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={inputValue || currentPage}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setInputValue(String(currentPage))}
          onBlur={() => setInputValue('')}
          className="w-10 rounded border border-gray-200 bg-transparent px-1 py-0.5 text-center text-xs text-gray-700 dark:border-gray-600 dark:text-gray-300"
          aria-label="Current page number"
          title="Page number"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">of {totalPages}</span>
      </form>

      <button
        onClick={nextPage}
        disabled={currentPage >= totalPages}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Next page"
        title="Next page"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
