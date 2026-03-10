import { useState, useCallback } from 'react';
import type { ExportFormat, ExportOptions } from '../../core/types';

export interface ExportDialogProps {
  /** Source format of the CAD file */
  sourceFormat: 'dwg' | 'dxf';
  /** Original file name (used for default output name) */
  fileName: string;
  /** Called when user confirms export */
  onExport: (options: ExportOptions) => void;
  /** Called when dialog is closed / cancelled */
  onClose: () => void;
  /** Whether an export is currently in progress */
  isExporting?: boolean;
  /** Theme */
  theme?: 'light' | 'dark';
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: 'svg', label: 'SVG', desc: 'Scalable vector — best for editing' },
  { value: 'png', label: 'PNG', desc: 'Lossless raster with transparency' },
  { value: 'jpeg', label: 'JPEG', desc: 'Compressed raster — smaller file' },
  { value: 'pdf', label: 'PDF', desc: 'Print-ready document' },
];

const SCALE_OPTIONS: { value: 1 | 2 | 4; label: string }[] = [
  { value: 1, label: '1x — Standard' },
  { value: 2, label: '2x — High DPI' },
  { value: 4, label: '4x — Ultra HD' },
];

export default function ExportDialog({
  sourceFormat,
  fileName,
  onExport,
  onClose,
  isExporting = false,
  theme = 'light',
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<1 | 2 | 4>(2);
  const [background, setBackground] = useState('#FFFFFF');

  const isDark = theme === 'dark';

  const stem = fileName.replace(/\.\w+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  const outputName = `${stem}.${ext}`;

  const handleExport = useCallback(() => {
    onExport({ format, scale, background, fileName: outputName });
  }, [format, scale, background, outputName, onExport]);

  const showScale = format !== 'svg';

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget && !isExporting) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Export drawing"
    >
      <div
        className="w-full max-w-md rounded-xl border shadow-2xl"
        style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
              Export Drawing
            </h2>
            <p className="text-xs mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              {sourceFormat.toUpperCase()} &rarr; Convert &amp; download
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            style={{
              color: isDark ? '#94a3b8' : '#64748b',
              ...(isExporting ? { opacity: 0.4 } : {}),
            }}
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Format selector */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              Output Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((opt) => {
                const selected = format === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    disabled={isExporting}
                    className="flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors"
                    style={{
                      borderColor: selected
                        ? '#3b82f6'
                        : isDark ? '#334155' : '#e2e8f0',
                      backgroundColor: selected
                        ? (isDark ? '#1e3a5f' : '#eff6ff')
                        : (isDark ? '#0f172a' : '#f8fafc'),
                    }}
                    aria-pressed={selected}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: selected ? '#3b82f6' : (isDark ? '#e2e8f0' : '#1e293b') }}
                    >
                      {opt.label}
                    </span>
                    <span className="text-[11px] mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution (only for raster/PDF) */}
          {showScale && (
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Resolution
              </label>
              <div className="flex gap-2">
                {SCALE_OPTIONS.map((opt) => {
                  const selected = scale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setScale(opt.value)}
                      disabled={isExporting}
                      className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors"
                      style={{
                        borderColor: selected
                          ? '#3b82f6'
                          : isDark ? '#334155' : '#e2e8f0',
                        backgroundColor: selected
                          ? (isDark ? '#1e3a5f' : '#eff6ff')
                          : (isDark ? '#0f172a' : '#f8fafc'),
                        color: selected ? '#3b82f6' : (isDark ? '#cbd5e1' : '#475569'),
                      }}
                      aria-pressed={selected}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Background color */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: isDark ? '#94a3b8' : '#64748b' }}
            >
              Background
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                disabled={isExporting}
                className="h-8 w-10 cursor-pointer rounded border"
                style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
                aria-label="Background color"
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                disabled={isExporting}
                className="w-24 rounded border px-2 py-1 text-xs font-mono"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                }}
                aria-label="Background hex color"
              />
              <button
                onClick={() => setBackground('#FFFFFF')}
                disabled={isExporting}
                className="rounded border px-2 py-1 text-xs"
                style={{
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                White
              </button>
              <button
                onClick={() => setBackground('#000000')}
                disabled={isExporting}
                className="rounded border px-2 py-1 text-xs"
                style={{
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                Black
              </button>
            </div>
          </div>

          {/* Output filename preview */}
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            Output: <span className="font-medium" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>{outputName}</span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 border-t px-6 py-4"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: isDark ? '#cbd5e1' : '#475569',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors"
            style={{
              backgroundColor: isExporting ? '#6b7280' : '#3b82f6',
              cursor: isExporting ? 'wait' : 'pointer',
            }}
          >
            {isExporting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Exporting…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
