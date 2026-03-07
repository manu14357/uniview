import type { CommonDxfTableEntry } from '../uniview-types';

export interface LTypeTableEntry extends CommonDxfTableEntry {
    subclassMarker: 'UvDbLinetypeTableRecord';
    name: string;
    standardFlag: number;
    description: string;
    numberOfLineTypes: number;
    totalPatternLength: number;
    pattern?: LineTypeElement[];
}

export interface LineTypeElement {
    elementLength: number;
    elementTypeFlag: number;
    shapeNumber?: number;
    styleObjectId?: string;
    scale?: number;
    rotation?: number;
    offsetX?: number;
    offsetY?: number;
    text?: string;
}
