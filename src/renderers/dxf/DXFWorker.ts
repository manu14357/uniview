import type { WorkerResponse } from '../../core/types';
import { WorkerWrapper } from '../../utils/workerFactory';

/**
 * DXF Worker bridge — handles off-main-thread DXF parsing.
 */
export class DXFWorkerBridge {
  private worker: WorkerWrapper | null = null;

  async init(): Promise<void> {
    if (this.worker) return;

    const WorkerModule = await import('../../workers/dxf.worker?worker');
    const WorkerConstructor = WorkerModule.default as unknown as new () => Worker;
    this.worker = new WorkerWrapper(new WorkerConstructor());
  }

  async parseDocument(data: ArrayBuffer): Promise<WorkerResponse> {
    await this.init();
    return this.worker!.send<ArrayBuffer>('parse', data, [data]);
  }

  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
  }
}
