import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs'
import { join } from 'path'
import { DxfArrayScanner } from '../../uniview-dxf-array-scanner'
import { createParser } from '../../uniview-shared/uniview-parser-generator'
import { XRecordDXFObjectSnippet } from './uniview-parser'
import { RecordCloneFlag } from '../uniview-consts'
import type { XRecordDXFObject } from './uniview-types';

describe('XRecordParser parser', () => {
  test('tc0', () => {
      const content = readFileSync(join(__dirname, "./tc0.partial_dxf"), "utf-8");
      const scanner = new DxfArrayScanner(content.split("\n"));
      const parser = createParser(XRecordDXFObjectSnippet);

      let curr = scanner.next();
      curr = scanner.next(); // skip 0

      const obj: any = { name: 'XRECORD' }

      parser(curr, scanner, obj)

      expect(obj).toMatchObject<XRecordDXFObject>({
        name: 'XRECORD',
        subclassMarker: "UvDbXrecord",
        handle: "14EF",
        ownerObjectId: "B",
        extensions: {
          ACAD_REACTORS: [
            { code: 330, value: "B" }
          ]
        },
        cloneFlag: RecordCloneFlag.KEEP_EXISTING,
        data: [
          { code: 300, value: 'ACD' },
          { code: 300, value: '2019' },
          { code: 300, value: 'ACD_F_S' },
        ]
      })
  })
})