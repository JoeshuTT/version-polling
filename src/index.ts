import { createWorker, createWorkerFunc, closeWorker } from "./utils/index";

let APP_ETAG_KEY = "__APP_ETAG__";
let myWorker: Worker;

export interface VersionPollingOptions {
  appETagKey?: string;
  pollingInterval?: number;
  immediate: boolean;
  htmlFileUrl?: string;
  silent?: boolean;
  onUpdate: (data: any) => void;
}

export class VersionPolling {
  options: VersionPollingOptions;
  appEtag = "";

  constructor(options: VersionPollingOptions) {
    this.options = options;

    this.init();
  }

  async init() {
    const {
      appETagKey = APP_ETAG_KEY,
      pollingInterval = 5 * 60 * 1000, // 默认单位为毫秒
      immediate = true,
      htmlFileUrl = `${location.origin}${location.pathname}`,
      silent = false,
    } = this.options;

    const lastEtag = localStorage.getItem(`${appETagKey}`);
    if (!lastEtag) {
      const response = await fetch(htmlFileUrl, {
        method: "HEAD",
        cache: "no-cache",
      });
      const etag = response.headers.get("etag") as string;
      this.appEtag = etag;
      localStorage.setItem(`${this.options.appETagKey}`, etag);
    }

    // 安静模式
    if (silent) {
      return;
    }

    myWorker = createWorker(createWorkerFunc);

    myWorker.postMessage({
      code: "start",
      data: {
        appETagKey,
        htmlFileUrl,
        pollingInterval,
        immediate,
        lastEtag: localStorage.getItem(`${appETagKey}`),
      },
    });

    myWorker.onmessage = (event) => {
      const { lastEtag, etag } = event.data;
      this.appEtag = etag;

      if (lastEtag !== etag) {
        closeWorker(myWorker);
        this.options.onUpdate?.(this);
      }
    };

    // 页面隐藏时停止轮询任务，页面再度可见时在继续
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        myWorker.postMessage({
          code: "pause",
        });
      } else {
        myWorker.postMessage({
          code: "resume",
        });
      }
    });
  }

  onRefresh() {
    localStorage.setItem(`${this.options.appETagKey}`, this.appEtag);
    window.location.reload();
  }

  onCancel() {}
}

export function createVersionPolling(options: VersionPollingOptions) {
  const versionPolling = new VersionPolling(options);

  return versionPolling;
}
