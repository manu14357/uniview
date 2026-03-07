import { BoundaryPathTypeFlag } from '../../../../uniview-consts';
import type { DxfArrayScanner, ScannerGroup } from '../../../uniview-dxf-array-scanner';
import { createParser } from '../../../uniview-shared/uniview-parser-generator';
import { EdgeBoundaryPathDataSnippets } from './uniview-edge';
import { PolylineSnippets } from './uniview-polyline';

export function parseBoundaryPathData(
    curr: ScannerGroup,
    scanner: DxfArrayScanner,
) {
    // assume start with 92
    const boundaryPathData = {
        boundaryPathTypeFlag: curr.value,
    };
    const isPolyline =
        boundaryPathData.boundaryPathTypeFlag & BoundaryPathTypeFlag.Polyline;

    curr = scanner.next();

    if (isPolyline) {
        createParser(PolylineSnippets)(curr, scanner, boundaryPathData);
        return boundaryPathData;
    }
    createParser(EdgeBoundaryPathDataSnippets)(curr, scanner, boundaryPathData);
    return boundaryPathData;
}
