import { parseExtensions } from '../uniview-shared';
import { DXFParserSnippet, Identity } from '../uniview-shared/uniview-parser-generator';

export const CommonObjectSnippets: DXFParserSnippet[] = [
    {
        code: 330,
        name: 'ownerObjectId',
        parser: Identity,
    },
    {
        code: 102, // {ACAD_XDICTIONARY
        parser: parseExtensions,
    },
    {
        code: 102, // {ACAD_REACTORS
        parser: parseExtensions,
    },
    {
        code: 102, // {application_name
        parser: parseExtensions,
    },
    {
        code: 5,
        name: 'handle',
        parser: Identity,
    },
];
