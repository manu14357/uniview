import { useViewerStore } from '../../store/viewerStore';
import { useZoom } from '../../hooks/useZoom';

/**
 * Zoom controls — minus, percentage dropdown, plus, fit width, fit page.
 */
export default function ZoomControl() {
  const zoom = useViewerStore((s) => s.zoom);
  const { zoomIn, zoomOut, setZoom, fitWidth, fitPage } = useZoom();

  const presets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={zoomOut}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>

      <select
        value=""
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'fit-width') fitWidth();
          else if (val === 'fit-page') fitPage();
          else setZoom(parseFloat(val));
        }}
        className="w-16 rounded border border-gray-200 bg-transparent px-1 py-1 text-center text-xs text-gray-700 dark:border-gray-600 dark:text-gray-300"
        aria-label="Zoom level"
        title="Zoom level"
      >
        <option value="" disabled>
          {Math.round(zoom * 100)}%
        </option>
        {presets.map((p) => (
          <option key={p} value={p}>
            {Math.round(p * 100)}%
          </option>
        ))}
        <option value="fit-width">Fit Width</option>
        <option value="fit-page">Fit Page</option>
      </select>

      <button
        onClick={zoomIn}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-600" />

      <button
        onClick={fitWidth}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Fit width"
        title="Fit width"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" />
        </svg>
      </button>

      <button
        onClick={fitPage}
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Fit page"
        title="Fit page"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
