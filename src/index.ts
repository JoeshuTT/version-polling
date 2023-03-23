import { createWorker, createWorkerFunc, closeWorker } from "./utils/index";

let APP_ETAG_KEY = "__APP_ETAG__";
let myWorker: Worker;
const defaultOptions = {
  appETagKey: APP_ETAG_KEY,
  pollingInterval: 5 * 60 * 1000, // 默认单位为毫秒
  immediate: true,
  htmlFileUrl: `${location.origin}${location.pathname}`,
  silent: false,
};
/**
 * 页面隐藏时停止轮询任务，页面再度可见时在继续
 */
function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    myWorker.postMessage({
      code: "pause",
    });
  } else {
    myWorker.postMessage({
      code: "resume",
    });
  }
}

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
    this.options = Object.assign({}, defaultOptions, options);

    this.init();
  }

  async init() {
    const { appETagKey, htmlFileUrl } = this.options;

    const lastEtag = localStorage.getItem(`${appETagKey}`);
    if (!lastEtag) {
      const response = await fetch(htmlFileUrl as string, {
        method: "HEAD",
        cache: "no-cache",
      });
      const etag = response.headers.get("etag") as string;
      this.appEtag = etag;
      localStorage.setItem(`${this.options.appETagKey}`, etag);
    }

    this.start();
  }

  start() {
    const { appETagKey, pollingInterval, immediate, htmlFileUrl, silent } =
      this.options;

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
        this.stop();
        this.options.onUpdate?.(this);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  stop() {
    if (myWorker) {
      closeWorker(myWorker);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }

  onRefresh() {
    localStorage.setItem(`${this.options.appETagKey}`, this.appEtag);
    window.location.reload();
  }

  onCancel() {
    localStorage.removeItem(`${this.options.appETagKey}`);
  }
}

export function createVersionPolling(options: VersionPollingOptions) {
  const versionPolling = new VersionPolling(options);

  return versionPolling;
}
