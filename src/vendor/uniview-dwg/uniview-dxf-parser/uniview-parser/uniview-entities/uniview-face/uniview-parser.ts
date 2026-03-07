import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner'
import { DXFParserSnippet, Identity, PointParser, createParser } from '../../uniview-shared/uniview-parser-generator'
import { CommonEntitySnippets } from '../uniview-shared';
import type { FaceEntity } from './uniview-types';

const FaceEntityParserSnippets: DXFParserSnippet[] = [
    {
        code: 13,
        name: 'vertices.3',
        parser: PointParser,
    },
    {
        code: 12,
        name: 'vertices.2',
        parser: PointParser,
    },
    {
        code: 11,
        name: 'vertices.1',
        parser: PointParser,
    },
    {
        code: 10,
        name: 'vertices.0',
        parser: PointParser,
    },
    {
        code: 100,
        name: 'subclassMarker',
        parser: Identity,
    },
    ...CommonEntitySnippets,
]

export class FaceEntityParser {
    static ForEntityName = '3DFACE';

    private parser = createParser(
        FaceEntityParserSnippets,
    );

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup): FaceEntity {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity
    }
}
