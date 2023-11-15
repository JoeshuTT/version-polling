import { VersionPollingOptions } from "./types";
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
