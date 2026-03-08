import { useEffect, useState, useCallback, useRef } from 'react';
import type { RendererProps, DocumentInfo, ViewerError } from '../../core/types';
import type { SpreadsheetData, SheetData, CellValue } from './xlsx.types';
import { toDocumentInfo } from './xlsx.types';
import SheetTabs from './SheetTabs';
import { EventBus } from '../../core/EventBus';
import { useViewerStore } from '../../store/viewerStore';
import { useZoom } from '../../hooks/useZoom';

/**
 * XLSX Renderer — uses SheetJS for parsing, renders a plain scrollable table.
 * Supports multi-sheet navigation and zoom.
 */
export default function XLSXRenderer({
  fileData,
  fileName,
  theme,
  onLoad,
  onError,
}: RendererProps) {
  const [data, setData] = useState<SpreadsheetData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoom = useViewerStore((s) => s.zoom);
  const { zoomIn, zoomOut } = useZoom();

  // Handle Ctrl+wheel zoom on the spreadsheet
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [zoomIn, zoomOut]);

  // Parse spreadsheet
  useEffect(() => {
    let cancelled = false;

    const parse = async () => {
      try {
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(fileData, { type: 'array' });

        if (cancelled) return;

        const sheets: Record<string, SheetData> = {};
        for (const name of workbook.SheetNames) {
          const ws = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json<CellValue[]>(ws, { header: 1 });
          const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
          const colCount = range.e.c - range.s.c + 1;

          // Calculate column widths
          const widths = ws['!cols']?.map((c) => (c.wch ?? 10) * 8) ?? Array(colCount).fill(100);

          sheets[name] = {
            name,
            rows: json,
            columnWidths: widths,
            rowCount: json.length,
            columnCount: colCount,
          };
        }

        const spreadsheetData: SpreadsheetData = {
          sheetNames: workbook.SheetNames,
          sheets,
        };

        if (cancelled) return;

        setData(spreadsheetData);
        setActiveSheet(workbook.SheetNames[0]);
        setIsLoading(false);

        const docInfo: DocumentInfo = toDocumentInfo(spreadsheetData, fileName, fileData.byteLength);
        useViewerStore.getState().setTotalPages(workbook.SheetNames.length);
        useViewerStore.getState().setDocumentInfo(docInfo);
        onLoad?.(docInfo);
        EventBus.emit('document:loaded', docInfo);
      } catch (err) {
        if (cancelled) return;
        setIsLoading(false);
        const viewerError: ViewerError = {
          code: 'XLSX_PARSE_ERROR',
          message: err instanceof Error ? err.message : 'Failed to parse spreadsheet',
          format: 'xlsx',
          originalError: err instanceof Error ? err : undefined,
        };
        onError?.(viewerError);
        EventBus.emit('document:error', viewerError);
      }
    };

    parse();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData, fileName, onLoad, onError]);

  const handleSheetChange = useCallback(
    (name: string) => {
      setActiveSheet(name);
      if (containerRef.current) containerRef.current.scrollTop = 0;
      const sheetIndex = data?.sheetNames.indexOf(name) ?? 0;
      useViewerStore.getState().setCurrentPage(sheetIndex + 1);
      EventBus.emit('page:change', sheetIndex + 1);
    },
    [data],
  );

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        <span className="sr-only">Loading spreadsheet...</span>
      </div>
    );
  }

  const sheet = data.sheets[activeSheet];
  if (!sheet) return null;

  return (
    <div
      className={`uv-xlsx-renderer absolute inset-0 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      role="document"
      aria-label={`Spreadsheet: ${fileName}`}
    >
      {/* Scrollable table area */}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto"
      >
        <table
          className="border-collapse text-sm"
          style={{ fontSize: `${zoom}rem` }}
          role="grid"
        >
          <tbody>
            {sheet.rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`${rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}`}
              >
                {/* Row number */}
                <td className="sticky left-0 z-10 w-12 border border-gray-200 bg-gray-100 px-2 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                  {rowIdx + 1}
                </td>
                {Array.from({ length: sheet.columnCount }).map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className="whitespace-nowrap border border-gray-200 px-2 py-1 dark:border-gray-700 dark:text-gray-300"
                    style={{ minWidth: (sheet.columnWidths[colIdx] ?? 100) * zoom }}
                  >
                    {row[colIdx] != null ? String(row[colIdx]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet tabs */}
      <SheetTabs
        sheets={data.sheetNames}
        activeSheet={activeSheet}
        onSheetChange={handleSheetChange}
      />
    </div>
  );
}
