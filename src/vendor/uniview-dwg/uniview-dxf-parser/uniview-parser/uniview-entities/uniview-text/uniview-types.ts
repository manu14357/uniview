import type { Point3D } from '../../../uniview-types';
import type { CommonDxfEntity } from '../uniview-shared';
import type { TextHorizontalAlign, TextVerticalAlign } from './uniview-consts';

export interface TextEntity extends CommonDxfEntity {
    type: 'TEXT';
    subclassMarker: 'UvDbText';
    text: string;
    thickness: number;
    startPoint: Point3D;
    endPoint: Point3D;
    textHeight: number;
    rotation: number; // degree
    xScale: number;
    obliqueAngle: number;
    styleName: string;
    generationFlag: number;
    halign: TextHorizontalAlign;
    valign: TextVerticalAlign;
    extrusionDirection: Point3D;
}
