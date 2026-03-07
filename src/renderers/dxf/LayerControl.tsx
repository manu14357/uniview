import type { CADLayer } from '../../core/types';
import { useLayerStore } from '../../store/layerStore';

/**
 * Layer visibility control panel for DXF/DWG renderers.
 * Shows/hides layers, displays color swatches, and lock state.
 */
export default function LayerControl() {
  const { layers, toggleVisibility, toggleLock } = useLayerStore();

  if (layers.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        No layers found in this drawing.
      </div>
    );
  }

  return (
    <div className="uv-layer-control p-2" role="tree" aria-label="CAD layers">
      {layers.map((layer: CADLayer) => (
        <div
          key={layer.id}
          className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          role="treeitem"
          aria-label={`Layer: ${layer.name}`}
        >
          {/* Visibility toggle */}
          <button
            onClick={() => toggleVisibility(layer.id)}
            className="flex h-5 w-5 items-center justify-center"
            aria-label={`${layer.visible ? 'Hide' : 'Show'} layer ${layer.name}`}
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? (
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>

          {/* Lock toggle */}
          <button
            onClick={() => toggleLock(layer.id)}
            className="flex h-5 w-5 items-center justify-center"
            aria-label={`${layer.locked ? 'Unlock' : 'Lock'} layer ${layer.name}`}
            title={layer.locked ? 'Unlock layer' : 'Lock layer'}
          >
            {layer.locked ? (
              <svg className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
              </svg>
            )}
          </button>

          {/* Color swatch */}
          <div
            className="h-3.5 w-3.5 rounded border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: layer.color }}
            aria-label={`Color: ${layer.color}`}
          />

          {/* Layer name */}
          <span
            className={`flex-1 truncate text-sm ${
              layer.visible
                ? 'text-gray-800 dark:text-gray-200'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {layer.name}
          </span>
        </div>
      ))}
    </div>
  );
}
