import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import {
    createParser,
    DXFParserSnippet,
    Identity,
    PointParser,
} from '../../uniview-shared/uniview-parser-generator';
import { CommonEntitySnippets } from '../uniview-shared';
import type { ToleranceEntity } from './uniview-types';

const ToleranceEntityParserSnippets: DXFParserSnippet[] = [
    {
        code: 11,
        name: 'xAxisDirection',
        parser: PointParser,
    },
    {
        code: 210,
        name: 'extrusionDirection',
        parser: PointParser,
    },
    {
        code: 1,
        name: 'text',
        parser: Identity,
    },
    {
        code: 10,
        name: 'position',
        parser: PointParser,
    },
    {
        code: 3,
        name: 'styleName',
        parser: Identity,
    },
    {
        code: 100,
        name: 'subclassMarker',
        parser: Identity,
    },
    ...CommonEntitySnippets,
];

export class ToleranceEntityParser {
    static ForEntityName = 'TOLERANCE';
    private parser = createParser(ToleranceEntityParserSnippets);

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity as ToleranceEntity;
    }
}