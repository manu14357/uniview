import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import { isMatched } from '../../uniview-shared';
import { parseDimension } from './uniview-common';
import type { DimensionEntity } from './uniview-types';

export class DimensionParser {
    static ForEntityName = 'DIMENSION';

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as DimensionEntity;

        while (!isMatched(curr, 0, 'EOF')) {
            if (curr.code === 0) {
                scanner.rewind();
                return entity;
            }

            parseDimension(entity, curr, scanner);
            curr = scanner.next();
        }

        return entity;
    }
}
