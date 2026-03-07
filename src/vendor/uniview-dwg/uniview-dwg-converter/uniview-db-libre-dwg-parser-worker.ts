/// <reference lib="webworker" />

import { UvDbBaseWorker, UvDbParsingTaskResult } from '@uniview/data-model'
import { DwgDatabase } from '@uniview/dwg-wasm'

import { parseDwg } from './uniview-db-libre-dwg-converter-util'
/**
 * DWG parsing worker
 */
class UvDbDwgParserWorker extends UvDbBaseWorker<
  string,
  UvDbParsingTaskResult<DwgDatabase>
> {
  protected async executeTask(dxfString: string) {
    const result = await parseDwg(dxfString)
    return {
      model: result.database,
      data: result.stats
    }
  }
}

// Initialize the worker
new UvDbDwgParserWorker()
