/// <reference lib="webworker" />
import { ParsedDxf } from '@uniview/dxf-parser'

import { UvDbDxfParser } from '../uniview-db-dxf-parser'
import { UvDbBaseWorker } from './uniview-db-base-worker'

/**
 * DXF parsing worker
 */
class UvDbDxfParserWorker extends UvDbBaseWorker<ArrayBuffer, ParsedDxf> {
  protected async executeTask(data: ArrayBuffer): Promise<ParsedDxf> {
    const parser = new UvDbDxfParser()
    return parser.parse(data)
  }
}

// Initialize the worker
export const dxfParser = new UvDbDxfParserWorker()
