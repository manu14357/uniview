import type { CommonDxfEntity } from '../uniview-shared';

export interface BodyEntity extends CommonDxfEntity {
    type: 'BODY';
    subclassMarker: 'UvDbModelerGeometry';
    /** Modeler format version number (currently = 1) */
    version: number;
    /** Proprietary data */
    data: string;
}