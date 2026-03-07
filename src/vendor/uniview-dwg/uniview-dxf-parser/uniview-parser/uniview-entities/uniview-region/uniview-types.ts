import type { CommonDxfEntity } from '../uniview-shared';

export interface RegionEntity extends CommonDxfEntity {
    type: 'REGION';
    subclassMarker: 'UvDbModelerGeometry';
    /** Modeler format version number (currently = 1) */
    version: number;
    /** Proprietary data */
    data: string;
}