import type { DxfArrayScanner, ScannerGroup } from '../../uniview-dxf-array-scanner';
import {
    createParser,
    DXFParserSnippet,
    Identity,
} from '../../uniview-shared/uniview-parser-generator';
import { CommonEntitySnippets, createLongStringSnippet } from '../uniview-shared';
import type { Solid3DEntity } from './uniview-types';

const SolidEntityParserSnippets: DXFParserSnippet[] = [
    {
        code: 350,
        name: 'historyObjectSoftId',
        parser: Identity,
    },
    {
        code: 100, // UvDb3dSolid
        name: 'subclassMarker',
        parser: Identity,
    },
    ...createLongStringSnippet('data'),
    {
        code: 70,
        name: 'version',
        parser: Identity,
    },
    {
        code: 100, // UvDbModelerGeometry
    },
    ...CommonEntitySnippets,
];

export class Solid3DEntityParser {
    static ForEntityName = '3DSOLID';
    private parser = createParser(SolidEntityParserSnippets);

    parseEntity(scanner: DxfArrayScanner, curr: ScannerGroup) {
        const entity = {} as any;
        this.parser(curr, scanner, entity);
        return entity as Solid3DEntity;
    }
}