import LayerControl from '../../renderers/dxf/LayerControl';
import { useLayerStore } from '../../store/layerStore';

/**
 * Layer panel — CAD layer tree with eye/lock icons and color swatches.
 * Includes show all / hide all bulk controls.
 */
export default function LayerPanel() {
  const { layers, showAll, hideAll } = useLayerStore();

  return (
    <div className="flex flex-col">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
          Layers ({layers.length})
        </span>
        <div className="flex gap-1">
          <button
            onClick={showAll}
            className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Show all layers"
            title="Show all"
          >
            All
          </button>
          <button
            onClick={hideAll}
            className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Hide all layers"
            title="Hide all"
          >
            None
          </button>
        </div>
      </div>

      <LayerControl />
    </div>
  );
}
