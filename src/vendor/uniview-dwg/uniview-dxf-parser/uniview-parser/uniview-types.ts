import type { DxfHeader } from '../uniview-types/uniview-dxf-header';
import type { DxfBlock } from './uniview-blocks/uniview-types';
import type { CommonDxfEntity } from './uniview-entities/uniview-shared';
import type { CommonDXFObject } from './uniview-objects';
import type { BlockRecordTableEntry, DimStylesTableEntry, LayerTableEntry, LTypeTableEntry, StyleTableEntry, DxfTable, VPortTableEntry } from './uniview-tables';

export interface ParsedDxf {
    header: DxfHeader;
    blocks: Record<string, DxfBlock>;
    entities: CommonDxfEntity[];
    tables: {
        BLOCK_RECORD?: DxfTable<BlockRecordTableEntry>;
        DIMSTYLE?: DxfTable<DimStylesTableEntry>;
        STYLE?: DxfTable<StyleTableEntry>;
        LAYER?: DxfTable<LayerTableEntry>;
        LTYPE?: DxfTable<LTypeTableEntry>;
        VPORT?: DxfTable<VPortTableEntry>;
    };
    objects: {
        byName: Record<string, CommonDXFObject[]>;
        byTree?: CommonDXFObject;
    };
}
