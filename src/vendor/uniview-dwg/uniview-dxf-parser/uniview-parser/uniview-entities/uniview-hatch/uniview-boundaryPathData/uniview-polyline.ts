import { parsePoint } from '../../../uniview-shared/uniview-parse-point';
import {
    type DXFParserSnippet,
    Identity,
    ToBoolean,
} from '../../../uniview-shared/uniview-parser-generator';
import { CommonBoundaryPathDataSnippets } from './uniview-shared';

export const PolylineSnippets: DXFParserSnippet[] = [
    ...CommonBoundaryPathDataSnippets,
    {
        code: 10,
        name: 'vertices',
        parser(curr, scanner) {
            const vertex = { ...parsePoint(scanner), bulge: 0 };

            curr = scanner.next();
            if (curr.code === 42) {
                vertex.bulge = curr.value;
            } else {
                scanner.rewind();
            }

            return vertex;
        },
        isMultiple: true,
    },
    {
        code: 93,
        name: 'numberOfVertices',
        parser: Identity,
    },
    {
        code: 73,
        name: 'isClosed',
        parser: ToBoolean,
    },
    {
        code: 72,
        name: 'hasBulge',
        parser: ToBoolean,
    },
];
