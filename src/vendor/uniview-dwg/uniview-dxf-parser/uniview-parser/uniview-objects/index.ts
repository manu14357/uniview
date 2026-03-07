export type * from './uniview-types'
export * from './uniview-consts'
export * from './uniview-dictionary'
export * from './uniview-image-def'
export * from './uniview-layout'
export * from './uniview-plotSettings'
export * from './uniview-spatial_filter'

import type { DxfArrayScanner, ScannerGroup } from '../uniview-dxf-array-scanner';
import { createParser, DXFParserSnippet } from '../uniview-shared/uniview-parser-generator';
import { ImageDefSnippets } from './uniview-image-def';
import { LayoutSnippets } from './uniview-layout';
import { PlotSettingsSnippets } from './uniview-plotSettings';
import { DictionarySnippets } from './uniview-dictionary'
import { SpatialFilterSnippets } from './uniview-spatial_filter';
import { classify } from '../../uniview-utils';

const ObjectSchemas: Record<string, DXFParserSnippet[]> = {
    LAYOUT: LayoutSnippets,
    PLOTSETTINGS: PlotSettingsSnippets,
    DICTIONARY: DictionarySnippets,
    SPATIAL_FILTER: SpatialFilterSnippets,
    IMAGEDEF: ImageDefSnippets,
};

export function parseObjects(curr: ScannerGroup, scanner: DxfArrayScanner) {
    const result = [] as any[];

    while (curr.code !== 0 || !['EOF', 'ENDSEC'].includes(curr.value)) {
        const objectName = curr.value as string;
        const snippets = ObjectSchemas[objectName];

        if (curr.code === 0 && snippets?.length) {
            const parser = createParser(snippets);
            const parsedObject = { name: objectName } as any;

            curr = scanner.next();

            if (parser(curr, scanner, parsedObject)) {
                result.push(parsedObject);
                curr = scanner.peek();
            } else {
                curr = scanner.next();
            }
        } else {
            curr = scanner.next();
        }
    }

    return {
        byName: classify(result, ({ name }) => name),
    };
}
