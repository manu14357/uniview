import { DwgPoint2D } from '../uniview-common';
import { DwgCommonObject } from './uniview-common';
export interface DwgImageDefObject extends DwgCommonObject {
    fileName: string;
    size: DwgPoint2D;
    sizeOfOnePixel: DwgPoint2D;
    isLoaded: number;
    resolutionUnits: number;
}
//# sourceMappingURL=imageDef.d.ts.map