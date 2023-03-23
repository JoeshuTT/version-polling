/**
 * 是否有值
 * @param {*} val
 */
export declare function isDef(val: any): boolean;
/**
 * 创建一个 Web Work 实例
 * @param func
 */
export declare function createWorker(func: (e: any) => void): Worker;
export declare function createWorkerFunc(): Window & typeof globalThis;
export declare function closeWorker(worker: Worker): void;
