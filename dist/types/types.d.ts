export interface VersionPollingOptions {
    appETagKey?: string;
    pollingInterval?: number;
    immediate: boolean;
    htmlFileUrl: string;
    silent?: boolean;
    silentPollingInterval?: boolean;
    silentPageVisibility?: boolean;
    forceUpdate?: boolean;
    onUpdate?: (data: any) => void;
}
