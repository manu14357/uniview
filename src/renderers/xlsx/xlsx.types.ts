import type { DocumentInfo } from '../../core/types';

/** Parsed spreadsheet data */
export interface SpreadsheetData {
  sheetNames: string[];
  sheets: Record<string, SheetData>;
}

/** Individual sheet data */
export interface SheetData {
  name: string;
  rows: CellValue[][];
  columnWidths: number[];
  rowCount: number;
  columnCount: number;
}

/** Cell value — typed union */
export type CellValue = string | number | boolean | null;

/** Convert spreadsheet metadata to DocumentInfo */
export function toDocumentInfo(
  data: SpreadsheetData,
  fileName: string,
  fileSize: number,
): DocumentInfo {
  return {
    format: fileName.endsWith('.csv') ? 'csv' : 'xlsx',
    fileName,
    fileSize,
    pageCount: data.sheetNames.length,
    sheets: data.sheetNames,
  };
}
