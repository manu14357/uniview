import type { ColorIndex } from '../../../uniview-types';
import type { CommonDxfTableEntry } from '../uniview-types';

export interface LayerTableEntry extends CommonDxfTableEntry {
    subclassMarker: 'UvDbLayerTableRecord';
    name: string;
    standardFlag: number;
    colorIndex: ColorIndex;
    lineType: string;
    isPlotting: boolean;
    lineweight: number;
    plotStyleNameObjectId?: string;
    materialObjectId?: string;
}
