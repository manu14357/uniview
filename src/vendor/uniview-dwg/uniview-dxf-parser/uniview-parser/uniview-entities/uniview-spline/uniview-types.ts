import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface SplineEntity extends CommonDxfEntity {
    type: 'SPLINE';
    subclassMarker: 'UvDbSpline';
    normal?: Point3D;
    flag: number;
    degree: number;
    numberOfKnots: number;
    numberOfControlPoints: number;
    numberOfFitPoints: number;
    knotTolerance: number;
    controlTolerance: number;
    fitTolerance: number;
    startTangent?: Point3D;
    endTangent?: Point3D;
    knots: number[];
    weights?: number[];
    controlPoints: Point3D[];
    fitPoints: number[];
}
