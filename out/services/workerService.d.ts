/**
 * Worker service — manages background analysis tasks using VS Code's
 * extension host worker threads (Node.js worker_threads).
 */
import { isMainThread, parentPort, workerData } from 'worker_threads';
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
/**
 * Simple task queue for offloading heavy analysis to worker threads.
 * Falls back to in-process execution if workers are not available.
 */
export declare class WorkerService {
    private readonly queue;
    private activeWorkers;
    private readonly maxWorkers;
    constructor(maxWorkers?: number);
    /**
     * Enqueue a task for background execution.
     * Returns a promise that resolves with the task result.
     */
    enqueue<TInput, TOutput>(task: WorkerTask<TInput>): Promise<WorkerResult<TOutput>>;
    private processQueue;
    /** Cancel all queued tasks. */
    cancelAll(): void;
    get queueLength(): number;
}
export declare function getWorkerService(): WorkerService;
export { isMainThread, parentPort, workerData };
//# sourceMappingURL=workerService.d.ts.map