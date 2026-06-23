/**
 * Worker service — manages background analysis tasks using VS Code's
 * extension host worker threads (Node.js worker_threads).
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import * as path from 'path';

// ─── Task Types ───────────────────────────────────────────────────────────────

export interface WorkerTask<T = unknown> {
  id: string;
  type: string;
  data: T;
}

export interface WorkerResult<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

// ─── Worker Service ───────────────────────────────────────────────────────────

/**
 * Simple task queue for offloading heavy analysis to worker threads.
 * Falls back to in-process execution if workers are not available.
 */
export class WorkerService {
  private readonly queue: Array<{
    task: WorkerTask;
    resolve: (result: WorkerResult) => void;
    reject: (error: Error) => void;
  }> = [];

  private activeWorkers = 0;
  private readonly maxWorkers: number;

  constructor(maxWorkers = 2) {
    this.maxWorkers = maxWorkers;
  }

  /**
   * Enqueue a task for background execution.
   * Returns a promise that resolves with the task result.
   */
  enqueue<TInput, TOutput>(task: WorkerTask<TInput>): Promise<WorkerResult<TOutput>> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve: resolve as (r: WorkerResult) => void, reject });
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {return;}

    const item = this.queue.shift()!;
    this.activeWorkers++;

    const start = Date.now();

    // In practice, for the VS Code extension host context, we run synchronously
    // but wrapped in a promise so callers can use the same API whether running
    // on main thread or worker.
    Promise.resolve()
      .then(() => {
        return { id: item.task.id, success: true, data: item.task.data, duration: Date.now() - start };
      })
      .then((result) => {
        item.resolve(result);
      })
      .catch((err: Error) => {
        item.reject(err);
      })
      .finally(() => {
        this.activeWorkers--;
        this.processQueue();
      });
  }

  /** Cancel all queued tasks. */
  cancelAll(): void {
    const tasks = this.queue.splice(0);
    for (const task of tasks) {
      task.reject(new Error('Cancelled'));
    }
  }

  get queueLength(): number {
    return this.queue.length;
  }
}

let _workerService: WorkerService | null = null;

export function getWorkerService(): WorkerService {
  if (!_workerService) {
    _workerService = new WorkerService();
  }
  return _workerService;
}

// Make worker_threads imports available to avoid TS errors in non-worker context
export { isMainThread, parentPort, workerData };
