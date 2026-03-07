import type { WorkerResponse } from '../../core/types';
import { WorkerWrapper } from '../../utils/workerFactory';

/** Messages sent to the PDF worker */
export type PDFWorkerRequestType = 'parse' | 'renderPage' | 'getTextContent' | 'search';

/** PDF worker wrapper for off-main-thread parsing */
export class PDFWorkerBridge {
  private worker: WorkerWrapper | null = null;

  async init(): Promise<void> {
    if (this.worker) return;

    // Dynamic import for Vite worker bundling
    const WorkerModule = await import('../../workers/pdf.worker?worker');
    const WorkerConstructor = WorkerModule.default as unknown as new () => Worker;
    this.worker = new WorkerWrapper(new WorkerConstructor());
  }

  async parseDocument(data: ArrayBuffer): Promise<WorkerResponse> {
    await this.init();
    return this.worker!.send<ArrayBuffer>('parse', data, [data]);
  }

  async renderPage(
    pageNumber: number,
    scale: number,
    devicePixelRatio: number,
  ): Promise<WorkerResponse> {
    await this.init();
    return this.worker!.send('renderPage', { pageNumber, scale, devicePixelRatio });
  }

  async getTextContent(pageNumber: number): Promise<WorkerResponse> {
    await this.init();
    return this.worker!.send('getTextContent', { pageNumber });
  }

  async search(query: string): Promise<WorkerResponse> {
    await this.init();
    return this.worker!.send('search', { query });
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
