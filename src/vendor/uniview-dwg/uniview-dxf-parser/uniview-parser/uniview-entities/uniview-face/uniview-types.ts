import type { Point3D } from '../../..'; 
import type { CommonDxfEntity } from '../uniview-shared';

export interface FaceEntity extends CommonDxfEntity {
    subclassMarker: 'UvDbFace';
    vertices: Point3D[];
    shape: number;
}
