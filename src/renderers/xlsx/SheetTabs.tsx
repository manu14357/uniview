interface SheetTabsProps {
  sheets: string[];
  activeSheet: string;
  onSheetChange: (sheetName: string) => void;
}

/**
 * Multi-sheet navigation tabs for XLSX files.
 */
export default function SheetTabs({ sheets, activeSheet, onSheetChange }: SheetTabsProps) {
  return (
    <div
      className="uv-sheet-tabs flex border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
      role="tablist"
      aria-label="Spreadsheet sheets"
    >
      {sheets.map((name) => (
        <button
          key={name}
          role="tab"
          aria-selected={name === activeSheet}
          aria-label={`Sheet: ${name}`}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            name === activeSheet
              ? 'border-b-2 border-blue-500 bg-white text-blue-600 dark:bg-gray-900 dark:text-blue-400'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSheetChange(name)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
