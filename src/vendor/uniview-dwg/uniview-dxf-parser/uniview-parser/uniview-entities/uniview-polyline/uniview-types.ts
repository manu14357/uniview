import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';
import type { VertexEntity } from '../uniview-vertex/uniview-types';
import type { SmoothType } from './uniview-consts';

export interface PolylineEntity extends CommonDxfEntity {
    type: 'POLYLINE';
    subclassMarker: 'UvDb2dPolyline | UvDb3dPolyline';
    thickness: number;
    flag: number;
    startWidth: number;
    endWidth: number;
    meshMVertexCount: number;
    meshNVertexCount: number;
    surfaceMDensity: number;
    surfaceNDensity: number;
    smoothType: SmoothType;
    extrusionDirection: Point3D;
    vertices: VertexEntity[];
}
