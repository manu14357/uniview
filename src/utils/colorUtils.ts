/**
 * AutoCAD Color Index (ACI) to hex color conversion.
 * Standard DXF/DWG files use ACI color indices (0–255).
 */

const ACI_COLORS: Record<number, string> = {
  0: '#000000', // ByBlock
  1: '#FF0000', // Red
  2: '#FFFF00', // Yellow
  3: '#00FF00', // Green
  4: '#00FFFF', // Cyan
  5: '#0000FF', // Blue
  6: '#FF00FF', // Magenta
  7: '#FFFFFF', // White/Black (context-dependent)
  8: '#808080', // Dark gray
  9: '#C0C0C0', // Light gray
  10: '#FF0000',
  11: '#FF7F7F',
  12: '#CC0000',
  13: '#CC6666',
  14: '#990000',
  15: '#994C4C',
  16: '#7F0000',
  17: '#7F3F3F',
  18: '#4C0000',
  19: '#4C2626',
  20: '#FF3F00',
  21: '#FF9F7F',
  22: '#CC3300',
  23: '#CC7F66',
  24: '#992600',
  25: '#995F4C',
  26: '#7F1F00',
  27: '#7F4F3F',
  28: '#4C1300',
  29: '#4C2F26',
  30: '#FF7F00',
  31: '#FFBF7F',
  32: '#CC6600',
  33: '#CC9966',
  34: '#994C00',
  35: '#99724C',
  36: '#7F3F00',
  37: '#7F5F3F',
  38: '#4C2600',
  39: '#4C3926',
  40: '#FFBF00',
  41: '#FFDF7F',
  42: '#CC9900',
  43: '#CCB266',
  44: '#997200',
  45: '#99854C',
  46: '#7F5F00',
  47: '#7F6F3F',
  48: '#4C3900',
  49: '#4C4226',
  50: '#FFFF00',
  51: '#FFFF7F',
  52: '#CCCC00',
  53: '#CCCC66',
  54: '#999900',
  55: '#99994C',
  56: '#7F7F00',
  57: '#7F7F3F',
  58: '#4C4C00',
  59: '#4C4C26',
  60: '#BFFF00',
  70: '#7FFF00',
  80: '#3FFF00',
  90: '#00FF00',
  100: '#00FF3F',
  110: '#00FF7F',
  120: '#00FFBF',
  130: '#00FFFF',
  140: '#00BFFF',
  150: '#007FFF',
  160: '#003FFF',
  170: '#0000FF',
  180: '#3F00FF',
  190: '#7F00FF',
  200: '#BF00FF',
  210: '#FF00FF',
  220: '#FF00BF',
  230: '#FF007F',
  240: '#FF003F',
  250: '#333333',
  251: '#505050',
  252: '#696969',
  253: '#808080',
  254: '#B3B3B3',
  255: '#FFFFFF',
};

/** Convert ACI color index to hex string */
export function aciToHex(colorIndex: number): string {
  return ACI_COLORS[colorIndex] ?? '#FFFFFF';
}

/** Convert hex color string to RGB tuple */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/** Convert RGB tuple to hex string */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/** Convert hex to Three.js-compatible 0xRRGGBB number */
export function hexToThreeColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
