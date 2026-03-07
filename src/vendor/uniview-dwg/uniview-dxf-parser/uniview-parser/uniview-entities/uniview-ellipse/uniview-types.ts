import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';

export interface EllipseEntity extends CommonDxfEntity {
    type: 'ELLIPSE';
    subclassMarker: 'UvDbEllipse';
    center: Point3D;
    majorAxisEndPoint: Point3D;
    extrusionDirection: Point3D;
    axisRatio: number;
    startAngle: number; // radian
    endAngle: number; // radian
}
