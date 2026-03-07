import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import {
    createParser,
    DXFParserSnippet,
    Identity,
} from '../../uniview-shared/uniview-parser-generator';
import { CommonEntitySnippets, createLongStringSnippet } from '../uniview-shared';
import type { RegionEntity } from './uniview-types';

const RegionEntityParserSnippets: DXFParserSnippet[] = [
    ...createLongStringSnippet('data'),
    {
        code: 70,
        name: 'version',
        parser: Identity,
    },
    {
        code: 100,
        name: 'subclassMarker',
        parser: Identity,
    },
    ...CommonEntitySnippets,
];

export class RegionEntityParser {
    static ForEntityName = 'REGION';
    private parser = createParser(RegionEntityParserSnippets);

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity as RegionEntity;
    }
}