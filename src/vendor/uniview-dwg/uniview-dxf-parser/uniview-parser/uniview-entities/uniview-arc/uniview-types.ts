import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface ArcEntity extends CommonDxfEntity {
    type: 'ARC';
    subclassMarker: 'UvDbArc';
    thickness: number;
    center: Point3D;
    radius: number;
    startAngle: number;
    endAngle: number;
    extrusionDirection: Point3D;
}
