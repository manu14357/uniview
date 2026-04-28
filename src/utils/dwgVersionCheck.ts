/**
 * DWG version detection — reads the 6-byte ASCII header at the start of every DWG file.
 * Format: "AC" followed by a 4-digit code, e.g. "AC1032" for AutoCAD R2018.
 *
 * Reference: https://help.autodesk.com/view/OARX/2022/ENU/?guid=GUID-A809CD71-4655-41AF-ABAD-767D97C72C6E
 */

export interface DWGVersionInfo {
  /** Raw version string, e.g. "AC1032" */
  code: string;
  /** Human-readable label, e.g. "AutoCAD R2018" */
  label: string;
  /** Whether this version is supported by the embedded libredwg WASM engine */
  supported: boolean;
}

/** Map from DWG internal version code to human-readable release name */
const DWG_VERSION_MAP: Record<string, string> = {
  AC1006: 'AutoCAD R10',
  AC1009: 'AutoCAD R11/R12',
  AC1012: 'AutoCAD R13',
  AC1014: 'AutoCAD R14',
  AC1015: 'AutoCAD 2000',
  AC1018: 'AutoCAD 2004',
  AC1021: 'AutoCAD 2007',
  AC1024: 'AutoCAD 2010',
  AC1027: 'AutoCAD 2013',
  AC1032: 'AutoCAD 2018',
  // Versions beyond AC1032 are not yet supported by the bundled libredwg WASM
  AC1035: 'AutoCAD 2021',
  AC1037: 'AutoCAD 2022',
  AC1040: 'AutoCAD 2024',
  AC1043: 'AutoCAD 2025',
};

/**
 * Highest version code that the embedded libredwg WASM engine can handle.
 * Files with codes greater than this will be rejected before any WASM load.
 */
const MAX_SUPPORTED_CODE = 'AC1032';

/**
 * Reads the 6-byte DWG version header from an ArrayBuffer.
 * Returns null if the buffer does not look like a DWG file.
 */
export function checkDWGVersion(buffer: ArrayBuffer): DWGVersionInfo | null {
  if (buffer.byteLength < 6) return null;

  const bytes = new Uint8Array(buffer, 0, 6);
  const code = String.fromCharCode(...bytes);

  if (!code.startsWith('AC')) return null;

  const label = DWG_VERSION_MAP[code] ?? `Unknown version (${code})`;
  const supported = code <= MAX_SUPPORTED_CODE;

  return { code, label, supported };
}
