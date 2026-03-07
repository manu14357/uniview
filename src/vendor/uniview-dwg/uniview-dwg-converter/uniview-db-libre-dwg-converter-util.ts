import { Dwg_File_Type, LibreDwg } from '@uniview/dwg-wasm'

declare const __WASM_BASE_PATH__: string

export async function parseDwg(data: string) {
  // __WASM_BASE_PATH__ is injected at build time by Vite (vite.workers.config.ts).
  const basePath = typeof __WASM_BASE_PATH__ !== 'undefined' ? __WASM_BASE_PATH__ : undefined
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
