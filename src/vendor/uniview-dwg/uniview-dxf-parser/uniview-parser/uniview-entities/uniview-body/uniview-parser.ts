import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import {
    createParser,
    DXFParserSnippet,
    Identity,
} from '../../uniview-shared/uniview-parser-generator';
import { CommonEntitySnippets, createLongStringSnippet } from '../uniview-shared';
import type { BodyEntity } from './uniview-types';

const BodyEntityParserSnippets: DXFParserSnippet[] = [
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

export class BodyEntityParser {
    static ForEntityName = 'BODY';
    private parser = createParser(BodyEntityParserSnippets);

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity as BodyEntity;
    }
}