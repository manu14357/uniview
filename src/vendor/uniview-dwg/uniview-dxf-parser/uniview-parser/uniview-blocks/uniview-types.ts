import type { Point3D } from '../../uniview-types';
import type { CommonDxfEntity } from '../uniview-entities/uniview-shared';

export interface DxfBlock {
    type: number; // bit flag of BlockTypeFlag
    name: string;
    name2: string;
    handle: string;
    ownerHandle: string;
    layer: string;
    position: Point3D;
    paperSpace: boolean;
    xrefPath: string;
    entities?: CommonDxfEntity[];
}
