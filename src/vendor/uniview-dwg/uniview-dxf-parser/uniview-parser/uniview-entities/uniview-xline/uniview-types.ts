import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface XLineEntity extends CommonDxfEntity {
    type: 'XLINE';
    subclassMarker: 'UvDbXline';
    position: Point3D;
    direction: Point3D;
}