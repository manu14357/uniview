import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface SolidEntity extends CommonDxfEntity {
    type: 'SOLID';
    subclassMarker: 'UvDbTrace';
    points: Point3D[];
    thickness: number;
    extrusionDirection: Point3D;
}
