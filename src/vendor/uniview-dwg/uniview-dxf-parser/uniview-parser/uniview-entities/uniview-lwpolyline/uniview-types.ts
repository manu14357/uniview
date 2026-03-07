import type { Point2D, Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface LWPolylineEntity extends CommonDxfEntity {
    type: 'LWPOLYLINE';
    subclassMarker: 'UvDbPolyline';
    numberOfVertices: number;
    flag: number;
    constantWidth?: number;
    elevation: number;
    thickness: number;
    extrusionDirection: Point3D;
    vertices: LWPolylineVertex[];
}

export interface LWPolylineVertex extends Point2D {
    id: number;
    startWidth?: number;
    endWidth?: number;
    bulge: number;
}
