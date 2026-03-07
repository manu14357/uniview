/**
 * CAD unit conversion utilities.
 * DWG/DXF files may use different unit systems; this module
 * provides conversion between common CAD measurement units.
 */

export type CADUnit =
  | 'unitless'
  | 'inches'
  | 'feet'
  | 'miles'
  | 'millimeters'
  | 'centimeters'
  | 'meters'
  | 'kilometers'
  | 'microinches'
  | 'mils'
  | 'yards'
  | 'angstroms'
  | 'nanometers'
  | 'microns'
  | 'decimeters';

/** DXF/DWG unit code → unit name mapping (INSUNITS header variable) */
const UNIT_CODE_MAP: Record<number, CADUnit> = {
  0: 'unitless',
  1: 'inches',
  2: 'feet',
  3: 'miles',
  4: 'millimeters',
  5: 'centimeters',
  6: 'meters',
  7: 'kilometers',
  8: 'microinches',
  9: 'mils',
  10: 'yards',
  11: 'angstroms',
  12: 'nanometers',
  13: 'microns',
  14: 'decimeters',
};

/** Conversion factors to millimeters (base unit) */
const TO_MM: Record<CADUnit, number> = {
  unitless: 1,
  inches: 25.4,
  feet: 304.8,
  miles: 1_609_344,
  millimeters: 1,
  centimeters: 10,
  meters: 1000,
  kilometers: 1_000_000,
  microinches: 0.0000254,
  mils: 0.0254,
  yards: 914.4,
  angstroms: 0.0000001,
  nanometers: 0.000001,
  microns: 0.001,
  decimeters: 100,
};

/** Convert a value from one CAD unit to another */
export function convertUnit(value: number, from: CADUnit, to: CADUnit): number {
  if (from === to) return value;
  const inMM = value * TO_MM[from];
  return inMM / TO_MM[to];
}

/** Get unit name from DXF/DWG INSUNITS code */
export function unitFromCode(code: number): CADUnit {
  return UNIT_CODE_MAP[code] ?? 'unitless';
}

/** Get display label for a unit */
export function unitLabel(unit: CADUnit): string {
  const labels: Record<CADUnit, string> = {
    unitless: '',
    inches: 'in',
    feet: 'ft',
    miles: 'mi',
    millimeters: 'mm',
    centimeters: 'cm',
    meters: 'm',
    kilometers: 'km',
    microinches: 'μin',
    mils: 'mil',
    yards: 'yd',
    angstroms: 'Å',
    nanometers: 'nm',
    microns: 'μm',
    decimeters: 'dm',
  };
  return labels[unit];
}
