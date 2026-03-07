import { DwgPoint3D } from '../uniview-common';
import { DwgEntity } from './uniview-entity';
export interface DwgRayEntity extends DwgEntity {
    type: 'RAY';
    firstPoint: DwgPoint3D;
    unitDirection: DwgPoint3D;
}
//# sourceMappingURL=ray.d.ts.map