import type { SupportedFormat } from '../core/types';

/** Map of file extensions to supported formats */
const EXTENSION_MAP: Record<string, SupportedFormat> = {
  pdf: 'pdf',
  docx: 'docx',
  doc: 'doc',
  xlsx: 'xlsx',
  xls: 'xls',
  csv: 'csv',
  dxf: 'dxf',
  dwg: 'dwg',
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpeg',
  svg: 'svg',
  tiff: 'tiff',
  tif: 'tiff',
  bmp: 'bmp',
  webp: 'webp',
  txt: 'txt',
  rtf: 'rtf',
};

/** Map of MIME types to supported formats */
const MIME_MAP: Record<string, SupportedFormat> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
  'image/vnd.dxf': 'dxf',
  'image/x-dwg': 'dwg',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/tiff': 'tiff',
  'image/bmp': 'bmp',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'application/rtf': 'rtf',
};

/** Detect format from a File, URL string, or ArrayBuffer */
export function detectFormat(
  file: File | string | ArrayBuffer,
  formatHint?: SupportedFormat,
): SupportedFormat | null {
  if (formatHint) return formatHint;

  if (file instanceof File) {
    const fromMime = MIME_MAP[file.type];
    if (fromMime) return fromMime;
    return extractExtension(file.name);
  }

  if (typeof file === 'string') {
    return extractExtension(file);
  }

  return null;
}

function extractExtension(path: string): SupportedFormat | null {
  const cleaned = path.split('?')[0].split('#')[0];
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot === -1) return null;
  const ext = cleaned.slice(lastDot + 1).toLowerCase();
  return EXTENSION_MAP[ext] ?? null;
}

/** Check if a format is a CAD format */
export function isCADFormat(format: SupportedFormat): boolean {
  return format === 'dxf' || format === 'dwg';
}

/** Check if a format is an image format */
export function isImageFormat(format: SupportedFormat): boolean {
  return ['png', 'jpg', 'jpeg', 'svg', 'tiff', 'bmp', 'webp'].includes(format);
}

/** Check if a format is a document format */
export function isDocumentFormat(format: SupportedFormat): boolean {
  return ['pdf', 'docx', 'doc', 'txt', 'rtf'].includes(format);
}

/** Check if a format is a spreadsheet format */
export function isSpreadsheetFormat(format: SupportedFormat): boolean {
  return ['xlsx', 'xls', 'csv'].includes(format);
}
