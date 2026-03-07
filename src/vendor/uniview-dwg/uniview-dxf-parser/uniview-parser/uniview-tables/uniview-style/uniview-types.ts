import type { CommonDxfTableEntry } from '../uniview-types';

export interface StyleTableEntry extends CommonDxfTableEntry {
    subclassMarker: 'UvDbTextStyleTableRecord';
    name: string;
    standardFlag: number;
    fixedTextHeight: number;
    widthFactor: number;
    obliqueAngle: number;
    textGenerationFlag: number;
    lastHeight: number;
    font: string;
    bigFont: string;
    extendedFont?: string;
}
