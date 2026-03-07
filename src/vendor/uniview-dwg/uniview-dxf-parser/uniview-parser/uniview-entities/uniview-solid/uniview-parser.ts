import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import { generateIntegers } from '../../../uniview-utils';
import { CommonEntitySnippets } from '../uniview-shared';
import {
    createParser,
    DXFParserSnippet,
    Identity,
    PointParser,
} from '../../uniview-shared/uniview-parser-generator';
import type { SolidEntity } from './uniview-types';

const DefaultSolidEntity = {
    points: [],
    thickness: 0,
    extrusionDirection: { x: 0, y: 0, z: 1 },
};

const SolidEntityParserSnippets: DXFParserSnippet[] = [
    {
        code: 210,
        name: 'extrusionDirection',
        parser: PointParser,
    },
    {
        code: 39,
        name: 'thickness',
        parser: Identity,
    },
    {
        code: [...generateIntegers(10, 14)],
        name: 'points',
        isMultiple: true,
        parser: PointParser,
    },
    {
        code: 100,
        name: 'subclassMarker',
        parser: Identity,
    },
    ...CommonEntitySnippets,
];

export class SolidEntityParser {
    static ForEntityName = 'SOLID';
    private parser = createParser(
        SolidEntityParserSnippets,
        DefaultSolidEntity,
    );

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity as SolidEntity;
    }
}
