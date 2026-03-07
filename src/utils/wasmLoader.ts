/**
 * Generic WASM binary loader with progress tracking.
 * Loads the WASM binary asynchronously and returns the initialized module.
 */
export interface WasmLoadOptions {
  /** URL or path to the .wasm binary */
  wasmUrl: string;
  /** Optional progress callback (0–1) */
  onProgress?: (progress: number) => void;
  /** Import object passed to WebAssembly.instantiateStreaming */
  importObject?: WebAssembly.Imports;
}

export interface WasmModule {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
}

/**
 * Load and instantiate a WASM module from URL with progress tracking.
 */
export async function loadWasm(options: WasmLoadOptions): Promise<WasmModule> {
  const { wasmUrl, onProgress, importObject = {} } = options;

  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch WASM from ${wasmUrl}: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body || totalBytes === 0) {
    // Fallback: no streaming progress
    onProgress?.(0.5);
    const buffer = await response.arrayBuffer();
    onProgress?.(0.9);
    const result = await WebAssembly.instantiate(buffer, importObject);
    onProgress?.(1);
    return { instance: result.instance, module: result.module };
  }

  // Stream with progress
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    receivedBytes += value.length;
    if (totalBytes > 0) {
      onProgress?.(receivedBytes / totalBytes * 0.9); // Reserve 10% for compilation
    }
  }

  // Combine chunks into single buffer
  const wasmBytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    wasmBytes.set(chunk, offset);
    offset += chunk.length;
  }

  onProgress?.(0.95);
  const result = await WebAssembly.instantiate(wasmBytes.buffer, importObject);
  onProgress?.(1);

  return { instance: result.instance, module: result.module };
}
