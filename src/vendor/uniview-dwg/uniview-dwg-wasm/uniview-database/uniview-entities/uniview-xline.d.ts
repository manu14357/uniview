import { DwgPoint3D } from '../uniview-common';
import { DwgEntity } from './uniview-entity';
export interface DwgXlineEntity extends DwgEntity {
    type: 'XLINE';
    firstPoint: DwgPoint3D;
    unitDirection: DwgPoint3D;
}
//# sourceMappingURL=xline.d.ts.map