import { useAnnotationStore } from '../../store/annotationStore';
import { PRESET_COLORS } from './annotation.types';
import type { AnnotationTool } from './annotation.types';

const TOOLS: Array<{ id: AnnotationTool; label: string; icon: string }> = [
  { id: 'select', label: 'Select', icon: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z' },
  { id: 'pen', label: 'Draw', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  { id: 'highlight', label: 'Highlight', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'arrow', label: 'Arrow', icon: 'M17 8l4 4m0 0l-4 4m4-4H3' },
  { id: 'rectangle', label: 'Rectangle', icon: 'M4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
  { id: 'text', label: 'Text Note', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
];

const LINE_WIDTHS = [1, 2, 3, 5, 8];

/**
 * Floating annotation toolbar — tools, color picker, line width, export.
 */
export default function AnnotationToolbar() {
  const { activeTool, activeColor, activeLineWidth, setActiveTool, setActiveColor, setActiveLineWidth, clearAnnotations, exportAnnotations } = useAnnotationStore();

  const handleExport = () => {
    const json = exportAnnotations();
    const jsonStr = JSON.stringify(json, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
      role="toolbar"
      aria-label="Annotation tools"
    >
      {/* Tool buttons */}
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`rounded-lg p-2 transition-colors ${
            activeTool === tool.id
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          aria-label={tool.label}
          aria-pressed={activeTool === tool.id}
          title={tool.label}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
          </svg>
        </button>
      ))}

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-600" />

      {/* Color picker */}
      <div className="flex gap-1" role="radiogroup" aria-label="Annotation color">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            className={`h-5 w-5 rounded-full border-2 transition-transform ${
              activeColor === color
                ? 'scale-110 border-gray-800 dark:border-white'
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Color: ${color}`}
            role="radio"
            aria-checked={activeColor === color}
            title={color}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-600" />

      {/* Line width */}
      <div className="flex gap-1" role="radiogroup" aria-label="Line width">
        {LINE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setActiveLineWidth(w)}
            className={`flex h-7 w-7 items-center justify-center rounded ${
              activeLineWidth === w
                ? 'bg-gray-200 dark:bg-gray-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            role="radio"
            aria-checked={activeLineWidth === w}
            aria-label={`Line width: ${w}px`}
            title={`${w}px`}
          >
            <div
              className="rounded-full bg-gray-800 dark:bg-gray-200"
              style={{ width: `${w + 4}px`, height: `${w + 4}px` }}
            />
          </button>
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-600" />

      {/* Clear all */}
      <button
        onClick={() => clearAnnotations(0)}
        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        aria-label="Clear all annotations"
        title="Clear all"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Export JSON */}
      <button
        onClick={handleExport}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        aria-label="Export annotations as JSON"
        title="Export annotations"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  );
}
