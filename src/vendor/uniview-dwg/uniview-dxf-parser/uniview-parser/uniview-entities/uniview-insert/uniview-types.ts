import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface InsertEntity extends CommonDxfEntity {
    type: 'INSERT';
    subclassMarker: 'UvDbBlockReference';
    isVariableAttributes?: boolean;
    name: string;
    insertionPoint: Point3D;
    xScale: number;
    yScale: number;
    zScale: number;
    rotation: number; // degree
    columnCount: number;
    rowCount: number;
    columnSpacing: number;
    rowSpacing: number;
    extrusionDirection: Point3D;
}
