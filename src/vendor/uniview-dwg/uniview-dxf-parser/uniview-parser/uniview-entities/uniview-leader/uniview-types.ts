import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';
import type { LeaderCreationFlag } from './uniview-consts';

export interface LeaderEntity extends CommonDxfEntity {
    type: 'LEADER';
    subclassMarker: 'UvDbLeader';
    styleName: string;
    isArrowheadEnabled: boolean;
    isSpline: boolean;
    leaderCreationFlag: LeaderCreationFlag;
    isHooklineSameDirection: boolean;
    isHooklineExists: boolean;
    textHeight?: number;
    textWidth?: number;
    numberOfVertices?: number;
    vertices: Point3D[];
    byBlockColor?: number;
    associatedAnnotation?: string;
    normal?: Point3D;
    horizontalDirection?: Point3D;
    offsetFromBlock?: Point3D;
    offsetFromAnnotation?: Point3D;
}
