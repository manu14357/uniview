import ZoomControl from './ZoomControl';
import PageNavigation from './PageNavigation';
import type { ToolbarProps } from './toolbar.types';

/**
 * Main toolbar — logo, page navigation, zoom controls, and action buttons.
 */
export default function Toolbar({
  onToggleSidebar,
  onToggleAnnotations,
  onFullscreen,
  onDownload,
  onPrint,
  sidebar,
  annotations,
}: ToolbarProps) {
  return (
    <div
      className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-800"
      role="toolbar"
      aria-label="Document toolbar"
    >
      {/* Left section — Logo + Sidebar toggle */}
      <div className="flex items-center gap-2">
        {sidebar !== false && (
          <button
            onClick={onToggleSidebar}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">UniView</span>

        <div className="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-600" />
      </div>

      {/* Center section — Page navigation */}
      <div className="flex items-center gap-4">
        <PageNavigation />
        <ZoomControl />
      </div>

      {/* Right section — Action buttons */}
      <div className="flex items-center gap-1">
        {annotations !== false && (
          <button
            onClick={onToggleAnnotations}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle annotations"
            title="Annotations"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}

        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />

        <button
          onClick={onDownload}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Download file"
          title="Download"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={onPrint}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Print document"
          title="Print"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={onFullscreen}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Toggle fullscreen"
          title="Fullscreen"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zM16 3a1 1 0 011 1v3a1 1 0 11-2 0V5h-3a1 1 0 110-2h4zM4 13a1 1 0 011 1v2h3a1 1 0 110 2H4a1 1 0 01-1-1v-3a1 1 0 011-1zM17 13a1 1 0 01-1 1v2h-3a1 1 0 110 2h4a1 1 0 001-1v-3a1 1 0 01-1-1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
