import type {
    HatchAssociativity,
    HatchGradientColorFlag,
    HatchGradientFlag,
    HatchPatternType,
    HatchSolidFill,
    HatchStyle,
} from '../../../../uniview-consts/uniview-hatch';
import type { Point3D } from '../../../../uniview-types';
import type { CommonDxfEntity } from '../../uniview-shared';
import type { BoundaryPath } from './uniview-boundary-path';
import type { HatchDefinitionLine } from './uniview-definition-line';

interface HatchEntityBase extends CommonDxfEntity {
    type: 'HATCH';
    subclassMarker: 'UvDbHatch';
    elevationPoint: Point3D;
    extrusionDirection?: Point3D;
    patternName: string;
    solidFill: HatchSolidFill;
    patternFillColor: any; // ?
    associativity: HatchAssociativity;
    numberOfBoundaryPaths: number;
    boundaryPaths: BoundaryPath[];
    hatchStyle: HatchStyle;
    patternType: HatchPatternType;
    patternAngle?: number; // Pattern Fill Only
    patternScale?: number; // Pattern Fill Only
    numberOfDefinitionLines: number;
    definitionLines: HatchDefinitionLine[];
    pixelSize: number;
    numberOfSeedPoints: number;
    offsetVector?: Point3D;
    seedPoints?: Point3D[];
    gradientFlag?: HatchGradientFlag;
}

export interface GradientHatchEntity extends HatchEntityBase {
    gradientFlag: HatchGradientFlag.Gradient;
    gradientColorFlag: HatchGradientColorFlag;
    numberOfColors: 0 | 2;
    gradientRotation?: number; // radian, default = 0
    gradientDefinition: number; // 0 ~ 1
    colorTint?: number; // 0 ~ 1, default = 0
}

export type HatchEntity = GradientHatchEntity | HatchEntityBase;
