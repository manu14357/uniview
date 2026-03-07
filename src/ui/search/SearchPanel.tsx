import { useState, useCallback, useRef } from 'react';

interface SearchPanelProps {
  onSearch: (query: string) => void;
  results: Array<{ pageNumber: number; text: string }>;
  onNavigateResult: (pageNumber: number) => void;
  totalResults: number;
}

/**
 * Full-text search UI — input field, result count, and navigable result list.
 */
export default function SearchPanel({
  onSearch,
  results,
  onNavigateResult,
  totalResults,
}: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  return (
    <div className="flex flex-col border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <form onSubmit={handleSearch} className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in document..."
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-8 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            aria-label="Search document text"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {totalResults > 0 && (
        <div className="px-3 pb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </p>
          <div className="mt-1 max-h-48 overflow-y-auto">
            {results.map((result, i) => (
              <button
                key={i}
                onClick={() => onNavigateResult(result.pageNumber)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={`Result on page ${result.pageNumber}`}
              >
                <span className="flex-shrink-0 text-xs text-gray-400">p.{result.pageNumber}</span>
                <span className="truncate text-gray-700 dark:text-gray-300">{result.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
