import { Dwg_File_Type, LibreDwg } from '@uniview/dwg-wasm'

export async function parseDwg(data: string) {
  // Pass null so Emscripten resolves the WASM via its built-in
  // `new URL("libredwg-web.wasm", self.location.href)` which
  // correctly derives the path from the worker script URL.
  const libredwg = await LibreDwg.create(null)
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
