import type { DxfArrayScanner, ScannerGroup } from '../uniview-dxf-array-scanner';
import {
	createParser,
	DXFParserSnippet,
	Identity,
} from "../uniview-shared/uniview-parser-generator";
import { isMatched } from "../uniview-shared";
import type { DxfTable } from "./uniview-types";
import { parseBlockRecordTable } from "./uniview-blockRecord";
import { parseDimStyle } from "./uniview-dimStyle";
import { parseLayerTable } from "./uniview-layer";
import { parseLTypeTable } from "./uniview-ltype";
import { parseStyleTable } from "./uniview-style";
import { parseVPortTable } from "./uniview-vport";

const TableParsers = {
	BLOCK_RECORD: parseBlockRecordTable,
	DIMSTYLE: parseDimStyle,
	LAYER: parseLayerTable,
	LTYPE: parseLTypeTable,
	STYLE: parseStyleTable,
	VPORT: parseVPortTable,
};

const CommonTableParserSnippets: DXFParserSnippet[] = [
	{
		code: 70,
		name: "maxNumberOfEntries",
		parser: Identity,
	},
	{
		code: 100,
		name: "subclassMarker",
		parser: Identity,
	},
	{
		code: 330,
		name: "ownerObjectId",
		parser: Identity,
	},
	{
		// ACAD_XDICTIONARY, ignore
		code: 102,
	},
	{
		code: 360,
		isMultiple: true,
	},
	{
		code: 102,
	},
	{
		code: 5,
		name: "handle",
		parser: Identity,
	},
	{
		code: 2,
		name: "name",
		parser: Identity,
	},
];

const parseCommonTable = createParser(CommonTableParserSnippets);

export function parseTables(curr: ScannerGroup, scanner: DxfArrayScanner) {
	const tables = {} as any;

	while (!isMatched(curr, 0, "EOF")) {
		if (isMatched(curr, 0, "ENDSEC")) break;

		if (isMatched(curr, 0, "TABLE")) {
			curr = scanner.next();

			const table = { entries: [] as any[] } as DxfTable<any>;
			parseCommonTable(curr, scanner, table);
			tables[table.name] = table;
		}

		if (isMatched(curr, 0) && !isMatched(curr, 0, "ENDTAB")) {
			const name = curr.value;
			curr = scanner.next();

			// @ts-ignore
			const parseTable = TableParsers[name];
			if (!parseTable) {
				if (scanner.debug)
					console.warn(`parseTable: Invalid table name '${name}'`);
				curr = scanner.next();
				continue;
			}

			const record = {} as any;
			parseTable(curr, scanner, record);
			tables[name]?.entries.push(record);
		}
		curr = scanner.next();
	}

	return tables;
}
