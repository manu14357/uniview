import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface RayEntity extends CommonDxfEntity {
    type: 'RAY';
    subclassMarker: 'UvDbRay';
    /** Start point (in WCS) */
    position: Point3D;
    /** Unit direction vector (in WCS) */
    direction: Point3D;
}