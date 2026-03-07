import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';
import type { VertexFlag } from './uniview-consts';

export interface VertexEntity extends CommonDxfEntity, Point3D {
    subclassMarker: 'UvDb2dVertex' | 'UvDb3dPolylineVertex';
    startWidth: number;
    endWidth: number;
    bulge: number;
    flag: VertexFlag;
    tangentDirection: number;
    polyfaceIndex0?: number;
    polyfaceIndex1?: number;
    polyfaceIndex2?: number;
    polyfaceIndex3?: number;
    id: number;
}
