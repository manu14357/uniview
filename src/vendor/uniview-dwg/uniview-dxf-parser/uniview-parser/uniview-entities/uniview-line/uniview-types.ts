import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface LineEntity extends CommonDxfEntity {
    type: 'LINE';
    subclassMarker: 'UvDbLine';
    thickness: number;
    startPoint: Point3D;
    endPoint: Point3D;
    extrusionDirection: Point3D;
}
