import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import {
    createParser,
    DXFParserSnippet,
    Identity,
    PointParser,
} from '../../uniview-shared/uniview-parser-generator';
import { CommonEntitySnippets } from '../uniview-shared';
import type { XLineEntity } from './uniview-types';

const XLineEntityParserSnippets: DXFParserSnippet[] = [
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

export class XLineEntityParser {
    static ForEntityName = 'XLINE';
    private parser = createParser(XLineEntityParserSnippets);

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity as XLineEntity;
    }
}