export interface VersionPollingOptions {
    appETagKey?: string;
    pollingInterval?: number;
    immediate: boolean;
    htmlFileUrl?: string;
    silent?: boolean;
    onUpdate: (data: any) => void;
}
export declare class VersionPolling {
    options: VersionPollingOptions;
    appEtag: string;
    constructor(options: VersionPollingOptions);
    init(): Promise<void>;
    start(): void;
    stop(): void;
    onRefresh(): void;
    onCancel(): void;
}
export declare function createVersionPolling(options: VersionPollingOptions): VersionPolling;
