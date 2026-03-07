import { useState, useCallback } from 'react';
import { UniView } from '../src';
import type { DocumentInfo, SupportedFormat, ViewerError } from '../src';

/**
 * UniView Demo App — showcases all supported renderers.
 */
export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [activeSource, setActiveSource] = useState<'file' | 'url' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [docInfo, setDocInfo] = useState<DocumentInfo | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setActiveSource('file');
      setDocInfo(null);
    }
  }, []);

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (url.trim()) {
        setActiveSource('url');
        setDocInfo(null);
      }
    },
    [url],
  );

  const handleLoad = useCallback((info: DocumentInfo) => {
    setDocInfo(info);
    console.log('[UniView Demo] Document loaded:', info);
  }, []);

  const handleError = useCallback((err: ViewerError) => {
    console.error('[UniView Demo] Error:', err.code, err.message);
  }, []);

  const isDark = theme === 'dark';
  const themeClass = isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900';

  const isCAD =
    docInfo?.format === 'dxf' ||
    docInfo?.format === 'dwg' ||
    (file && /\.(dxf|dwg)$/i.test(file.name)) ||
    (url && /\.(dxf|dwg)$/i.test(url));

  return (
    <div className={`flex h-full flex-col ${themeClass}`}>
      {/* Header */}
      <header className={`flex items-center justify-between border-b px-5 py-2.5 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h1 className="text-base font-bold tracking-tight">
              UniView
            </h1>
          </div>

          {/* Document info badge */}
          {docInfo && (
            <div className={`flex items-center gap-2 rounded-full px-3 py-0.5 text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <span className="font-semibold uppercase text-blue-500">{docInfo.format}</span>
              <span className={`h-3 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              <span className="max-w-[200px] truncate">{docInfo.fileName}</span>
              <span className={`h-3 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              <span>{(docInfo.fileSize / 1024).toFixed(1)} KB</span>
              {docInfo.layers && docInfo.layers.length > 0 && (
                <>
                  <span className={`h-3 w-px ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <span>{docInfo.layers.length} layers</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              isDark
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {isDark ? 'Light' : 'Dark'}
          </button>

          {/* File input */}
          <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
            Open File
            <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.dxf,.dwg,.png,.jpg,.jpeg,.svg,.tiff,.bmp,.webp,.txt,.rtf" />
          </label>
        </div>
      </header>

      {/* URL input bar */}
      <div className={`border-b px-5 py-2 ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a file URL to load..."
            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs ${
              isDark
                ? 'border-gray-700 bg-gray-800 text-gray-200 placeholder-gray-500 focus:border-blue-500'
                : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
          <button
            type="submit"
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Load URL
          </button>
        </form>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        {activeSource === 'file' && file ? (
          <UniView
            file={file}
            theme={theme}
            toolbar={!isCAD}
            sidebar={true}
            annotations={!isCAD}
            initialZoom="fit"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : activeSource === 'url' && url ? (
          <UniView
            file={url}
            theme={theme}
            toolbar={!isCAD}
            sidebar={true}
            annotations={!isCAD}
            initialZoom="fit"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
            {/* Hero icon */}
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <svg className={`h-10 w-10 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">Welcome to UniView</h2>
              <p className={`mt-2 max-w-md text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Open a file or enter a URL to preview. Supports CAD drawings (DWG, DXF),
                documents (PDF, DOCX), spreadsheets (XLSX, CSV), images, and more.
              </p>
            </div>

            {/* Format badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { fmt: 'DWG', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
                { fmt: 'DXF', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
                { fmt: 'PDF', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
                { fmt: 'DOCX', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                { fmt: 'XLSX', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
                { fmt: 'PNG', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
                { fmt: 'SVG', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
                { fmt: 'CSV', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
                { fmt: 'TIFF', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
              ].map(({ fmt, color }) => (
                <span
                  key={fmt}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${color}`}
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* Quick action */}
            <label className="group cursor-pointer">
              <div className={`flex items-center gap-2 rounded-xl border-2 border-dashed px-8 py-4 transition-colors ${
                isDark
                  ? 'border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}>
                <svg className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-blue-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} group-hover:text-blue-500`}>
                  Drop a file here or click to browse
                </span>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.dxf,.dwg,.png,.jpg,.jpeg,.svg,.tiff,.bmp,.webp,.txt,.rtf" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
