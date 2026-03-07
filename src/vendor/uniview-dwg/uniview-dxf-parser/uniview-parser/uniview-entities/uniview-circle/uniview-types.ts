import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface CircleEntity extends CommonDxfEntity {
    type: 'CIRCLE';
    subclassMarker: 'UvDbCircle';
    thickness: number;
    center: Point3D;
    radius: number;
    extrusionDirection: Point3D;
}
