import { DwgPoint3D } from '../uniview-common';
import { DwgEntity } from './uniview-entity';
export interface DwgLineEntity extends DwgEntity {
    type: 'LINE';
    thickness: number;
    startPoint: DwgPoint3D;
    endPoint: DwgPoint3D;
    extrusionDirection: DwgPoint3D;
}
//# sourceMappingURL=line.d.ts.map