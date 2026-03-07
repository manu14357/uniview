import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import { CommonEntitySnippets } from '../uniview-shared';
import {
    createParser,
    DXFParserSnippet,
    Identity,
    PointParser,
} from '../../uniview-shared/uniview-parser-generator';
import type { RayEntity } from './uniview-types'

const RayEntityParserSnippets: DXFParserSnippet[] = [
    {
        code: 11,
        name: 'direction',
        parser: PointParser,
    },
    {
        code: 10,
        name: 'position',
        parser: PointParser,
    },
    {
        code: 100,
        name: 'subclassMarker',
        parser: Identity,
    },
    ...CommonEntitySnippets,
];

export class RayParser {
    static ForEntityName = 'RAY';
    private parser = createParser(RayEntityParserSnippets);

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity as RayEntity;
    }
}