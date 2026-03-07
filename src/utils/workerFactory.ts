import type { WorkerRequest, WorkerResponse } from '../core/types';

type PendingRequest = {
  resolve: (value: WorkerResponse) => void;
  reject: (reason: Error) => void;
};

/**
 * Worker wrapper that provides a promise-based API for communicating
 * with Web Workers using typed request/response messages.
 */
export class WorkerWrapper {
  private worker: Worker;
  private pending = new Map<string, PendingRequest>();
  private idCounter = 0;

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }

  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const response = event.data;
    const pending = this.pending.get(response.id);
    if (pending) {
      this.pending.delete(response.id);
      if (response.error) {
        pending.reject(new Error(response.error));
      } else {
        pending.resolve(response);
      }
    }
  }

  private handleError(event: ErrorEvent): void {
    // Reject all pending requests on worker error
    const error = new Error(event.message || 'Worker error');
    this.pending.forEach((pending) => pending.reject(error));
    this.pending.clear();
  }

  /** Send a request to the worker and wait for response */
  send<TReq = unknown, TRes = unknown>(
    type: string,
    payload: TReq,
    transfer?: Transferable[],
  ): Promise<WorkerResponse<TRes>> {
    return new Promise((resolve, reject) => {
      const id = `${++this.idCounter}-${Date.now()}`;
      this.pending.set(id, {
        resolve: resolve as (value: WorkerResponse) => void,
        reject,
      });

      const request: WorkerRequest<TReq> = { id, type, payload };

      if (transfer) {
        this.worker.postMessage(request, transfer);
      } else {
        this.worker.postMessage(request);
      }
    });
  }

  /** Terminate the worker and reject all pending requests */
  terminate(): void {
    const error = new Error('Worker terminated');
    this.pending.forEach((pending) => pending.reject(error));
    this.pending.clear();
    this.worker.terminate();
  }
}

/**
 * Create a managed worker instance from a Worker constructor.
 * Uses Vite's ?worker import pattern.
 */
export function createWorker(WorkerConstructor: new () => Worker): WorkerWrapper {
  const worker = new WorkerConstructor();
  return new WorkerWrapper(worker);
}
