import { Dwg_File_Type, LibreDwg } from '@uniview/dwg-wasm'

/**
 * Derive the WASM directory from the worker script's own URL at runtime.
 * This works regardless of deployment base path (e.g. /uniview/demo/workers/).
 */
function getWasmBasePath(): string | undefined {
  if (typeof self !== 'undefined' && self.location) {
    const href = self.location.href
    const lastSlash = href.lastIndexOf('/')
    if (lastSlash >= 0) return href.substring(0, lastSlash)
  }
  return undefined
}

export async function parseDwg(data: string) {
  const basePath = getWasmBasePath()
  const libredwg = await LibreDwg.create(basePath)
  if (libredwg == null) {
    throw new Error('libredwg is not loaded!')
  }

  const dwgDataPtr = libredwg.dwg_read_data(data, Dwg_File_Type.DWG)
  if (dwgDataPtr == null) {
    throw new Error('Failed to read dwg data!')
  }
  const result = libredwg.convertEx(dwgDataPtr)
  libredwg.dwg_free(dwgDataPtr)

  return result
}
