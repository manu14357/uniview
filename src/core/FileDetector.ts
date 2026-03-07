import type { SupportedFormat } from './types';

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
  'application/acad': 'dwg',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/tiff': 'tiff',
  'image/bmp': 'bmp',
  'image/webp': 'webp',
  'text/plain': 'txt',
  'application/rtf': 'rtf',
  'text/rtf': 'rtf',
};

/** Format groups for renderer routing */
export const FORMAT_GROUPS = {
  pdf: ['pdf'] as SupportedFormat[],
  docx: ['docx', 'doc'] as SupportedFormat[],
  xlsx: ['xlsx', 'xls', 'csv'] as SupportedFormat[],
  dxf: ['dxf'] as SupportedFormat[],
  dwg: ['dwg'] as SupportedFormat[],
  image: ['png', 'jpg', 'jpeg', 'svg', 'tiff', 'bmp', 'webp'] as SupportedFormat[],
  text: ['txt', 'rtf'] as SupportedFormat[],
} as const;

/** Detect format from a File object using both extension and MIME type */
export function detectFromFile(file: File): SupportedFormat | null {
  // Try MIME type first — more reliable
  const fromMime = MIME_MAP[file.type];
  if (fromMime) return fromMime;

  // Fall back to extension
  return detectFromExtension(file.name);
}

/** Detect format from a MIME type string (e.g. Content-Type header) */
export function detectFromMime(mime: string): SupportedFormat | null {
  return MIME_MAP[mime] ?? null;
}

/** Detect format from a filename or URL string */
export function detectFromExtension(path: string): SupportedFormat | null {
  const cleaned = path.split('?')[0].split('#')[0];
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot === -1) return null;

  const ext = cleaned.slice(lastDot + 1).toLowerCase();
  return EXTENSION_MAP[ext] ?? null;
}

/** Detect format from any supported input: File, URL string, or ArrayBuffer */
export function detectFormat(
  file: File | string | ArrayBuffer,
  formatHint?: SupportedFormat,
): SupportedFormat | null {
  // Explicit format hint takes priority
  if (formatHint) return formatHint;

  if (file instanceof File) {
    return detectFromFile(file);
  }

  if (typeof file === 'string') {
    return detectFromExtension(file);
  }

  // ArrayBuffer — cannot detect without hint
  return null;
}

/** Get the renderer group key for a given format */
export function getRendererGroup(
  format: SupportedFormat,
): keyof typeof FORMAT_GROUPS | null {
  for (const [group, formats] of Object.entries(FORMAT_GROUPS)) {
    if ((formats as readonly SupportedFormat[]).includes(format)) {
      return group as keyof typeof FORMAT_GROUPS;
    }
  }
  return null;
}
