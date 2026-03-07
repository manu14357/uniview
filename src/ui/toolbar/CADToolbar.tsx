import { useState, useCallback, useRef, useEffect } from 'react';

export interface CADCoordinates {
  x: number;
  y: number;
}

export interface CADToolbarProps {
  /** Current cursor position in world coordinates */
  coordinates: CADCoordinates;
  /** Current zoom level (1 = 100%) */
  zoom: number;
  /** Active tool mode */
  activeMode: 'select' | 'pan';
  /** Called when user clicks zoom in */
  onZoomIn: () => void;
  /** Called when user clicks zoom out */
  onZoomOut: () => void;
  /** Called when user clicks fit-to-view */
  onFitView: () => void;
  /** Called when user toggles between select and pan */
  onModeChange: (mode: 'select' | 'pan') => void;
  /** Called when user submits coordinates via input */
  onGoToCoordinates?: (coords: CADCoordinates) => void;
  /** Theme */
  theme?: 'light' | 'dark';
}

/**
 * CAD-specific floating toolbar with zoom controls, pan/select mode,
 * and live X/Y coordinate display with input field.
 */
export default function CADToolbar({
  coordinates,
  zoom,
  activeMode,
  onZoomIn,
  onZoomOut,
  onFitView,
  onModeChange,
  onGoToCoordinates,
  theme = 'light',
}: CADToolbarProps) {
  const [inputX, setInputX] = useState('');
  const [inputY, setInputY] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const xRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
  const text = isDark ? 'text-gray-200' : 'text-gray-700';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const activeBg = isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800';

  const handleCoordinateSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const x = parseFloat(inputX);
      const y = parseFloat(inputY);
      if (!isNaN(x) && !isNaN(y) && onGoToCoordinates) {
        onGoToCoordinates({ x, y });
        setIsEditing(false);
      }
    },
    [inputX, inputY, onGoToCoordinates],
  );

  // Sync display when not editing
  useEffect(() => {
    if (!isEditing) {
      setInputX(coordinates.x.toFixed(4));
      setInputY(coordinates.y.toFixed(4));
    }
  }, [coordinates.x, coordinates.y, isEditing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setInputX(coordinates.x.toFixed(4));
    setInputY(coordinates.y.toFixed(4));
    setTimeout(() => xRef.current?.select(), 0);
  }, [coordinates.x, coordinates.y]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      {/* ── Top-left: Tool mode buttons ── */}
      <div
        className={`absolute top-3 left-3 z-20 flex flex-col gap-1 rounded-lg border p-1 shadow-lg ${bg}`}
      >
        <ToolButton
          icon={<SelectIcon />}
          label="Select (V)"
          active={activeMode === 'select'}
          onClick={() => onModeChange('select')}
          hoverBg={hoverBg}
          activeBg={activeBg}
          text={text}
        />
        <ToolButton
          icon={<PanIcon />}
          label="Pan / Move (H)"
          active={activeMode === 'pan'}
          onClick={() => onModeChange('pan')}
          hoverBg={hoverBg}
          activeBg={activeBg}
          text={text}
        />

        <div className={`my-0.5 h-px ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />

        <ToolButton
          icon={<ZoomInIcon />}
          label="Zoom In (+)"
          onClick={onZoomIn}
          hoverBg={hoverBg}
          text={text}
        />
        <ToolButton
          icon={<ZoomOutIcon />}
          label="Zoom Out (-)"
          onClick={onZoomOut}
          hoverBg={hoverBg}
          text={text}
        />
        <ToolButton
          icon={<FitViewIcon />}
          label="Fit to View (F)"
          onClick={onFitView}
          hoverBg={hoverBg}
          text={text}
        />
      </div>

      {/* ── Top-right: Zoom level indicator ── */}
      <div
        className={`absolute top-3 right-3 z-20 rounded-lg border px-3 py-1.5 shadow-lg ${bg}`}
      >
        <span className={`text-xs font-medium ${text}`}>{zoomPercent}%</span>
      </div>

      {/* ── Bottom: Coordinate bar ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t px-4 py-1.5 ${bg}`}
      >
        {/* Live coordinate display / input */}
        <form onSubmit={handleCoordinateSubmit} className="flex items-center gap-2">
          <label className={`flex items-center gap-1 text-xs font-semibold ${textMuted}`}>
            <span className="text-red-500">X</span>
            <input
              ref={xRef}
              type="text"
              value={inputX}
              onChange={(e) => setInputX(e.target.value)}
              onFocus={startEditing}
              onBlur={() => setIsEditing(false)}
              className={`w-24 rounded border px-2 py-0.5 text-xs font-mono tabular-nums ${inputBg} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              aria-label="X coordinate"
            />
          </label>
          <label className={`flex items-center gap-1 text-xs font-semibold ${textMuted}`}>
            <span className="text-green-500">Y</span>
            <input
              type="text"
              value={inputY}
              onChange={(e) => setInputY(e.target.value)}
              onFocus={startEditing}
              onBlur={() => setIsEditing(false)}
              className={`w-24 rounded border px-2 py-0.5 text-xs font-mono tabular-nums ${inputBg} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              aria-label="Y coordinate"
            />
          </label>
          {isEditing && onGoToCoordinates && (
            <button
              type="submit"
              className="rounded bg-blue-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-600"
            >
              Go
            </button>
          )}
        </form>

        <div className={`h-4 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`} />

        {/* Zoom display */}
        <span className={`text-xs ${textMuted}`}>
          Zoom: <span className={`font-mono font-medium ${text}`}>{zoomPercent}%</span>
        </span>

        {/* Hint text */}
        <span className={`ml-auto text-xs ${textMuted}`}>
          Scroll to zoom · Middle-click or hold Space to pan
        </span>
      </div>
    </>
  );
}

/* ── Tool button sub-component ── */
function ToolButton({
  icon,
  label,
  active,
  onClick,
  hoverBg,
  activeBg,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  hoverBg: string;
  activeBg?: string;
  text: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active && activeBg ? activeBg : `${text} ${hoverBg}`
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

/* ── SVG Icons ── */
function SelectIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.071 18 2.929-7 7-2.929z" />
    </svg>
  );
}

function PanIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l-3 3 3 3" />
      <path d="M9 5l3-3 3 3" />
      <path d="M15 19l-3 3-3-3" />
      <path d="M19 9l3 3-3 3" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function FitViewIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}
