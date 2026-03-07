import type { CommonDxfTableEntry } from '../uniview-types';

export interface BlockRecordTableEntry extends CommonDxfTableEntry {
    subclassMarker: 'UvDbBlockTableRecord';
    name: string;
    layoutObjects: string;
    insertionUnits: number;
    explodability: number;
    scalability: number;
    bmpPreview: string;
}
