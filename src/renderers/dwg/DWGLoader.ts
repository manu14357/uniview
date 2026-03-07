/**
 * DWG Loader — delegates to @uniview/viewer.
 * The cad-simple-viewer handles its own WASM loading and web workers internally.
 * This file is kept for API compatibility but the heavy lifting is done by cad-simple-viewer.
 */

export class DWGLoader {
  private ready = false;

  async init(_onProgress?: (progress: number) => void): Promise<void> {
    // cad-simple-viewer initializes lazily when UvApDocManager.createInstance() is called
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  destroy(): void {
    this.ready = false;
  }
}

/** Singleton DWG loader */
export const dwgLoader = new DWGLoader();
