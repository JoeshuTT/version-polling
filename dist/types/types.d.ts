export interface VersionPollingOptions {
    appETagKey?: string;
    pollingInterval?: number;
    htmlFileUrl: string;
    silent?: boolean;
    silentPollingInterval?: boolean;
    silentPageVisibility?: boolean;
    forceUpdate?: boolean;
    onUpdate?: (data: any) => void;
}
