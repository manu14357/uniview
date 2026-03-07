import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface SectionEntity extends CommonDxfEntity {
    type: 'SECTION';
    subclassMarker: 'UvDbSection';
    state: number;
    flag: number;
    name: string;
    verticalDirection: Point3D;
    topHeight: number;
    bottomHeight: number;
    indicatorTransparency: number;
    indicatorColor: number;
    numberOfVertices: number;
    vertices: Point3D[];
    numberOfBackLineVertices: number;
    backLineVertices: Point3D[];
    geometrySettingHardId: string;
}
