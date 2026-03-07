import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface PointEntity extends CommonDxfEntity {
    type: 'POINT';
    position: Point3D;
    thickness: number;
    extrusionDirection: Point3D;
    angle: number;
}
