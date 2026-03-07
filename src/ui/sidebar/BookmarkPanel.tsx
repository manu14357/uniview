import { useState } from 'react';

interface BookmarkItem {
  title: string;
  pageNumber: number;
  children?: BookmarkItem[];
}

interface BookmarkPanelProps {
  bookmarks?: BookmarkItem[];
  onNavigate?: (page: number) => void;
}

/**
 * PDF bookmarks / outline tree — navigable tree of document sections.
 */
export default function BookmarkPanel({ bookmarks, onNavigate }: BookmarkPanelProps) {
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        No bookmarks in this document.
      </div>
    );
  }

  return (
    <div className="p-2" role="tree" aria-label="Document bookmarks">
      {bookmarks.map((item, i) => (
        <BookmarkNode key={i} item={item} onNavigate={onNavigate} depth={0} />
      ))}
    </div>
  );
}

function BookmarkNode({
  item,
  onNavigate,
  depth,
}: {
  item: BookmarkItem;
  onNavigate?: (page: number) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        className="flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-4 w-4 items-center justify-center text-gray-400"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        <button
          onClick={() => onNavigate?.(item.pageNumber)}
          className="flex-1 truncate text-left text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
          aria-label={`Go to: ${item.title}`}
        >
          {item.title}
        </button>
        <span className="text-xs text-gray-400">{item.pageNumber}</span>
      </div>

      {hasChildren && expanded && (
        <div role="group">
          {item.children!.map((child, j) => (
            <BookmarkNode key={j} item={child} onNavigate={onNavigate} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
