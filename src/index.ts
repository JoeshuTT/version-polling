import { createWorker, createWorkerFunc, closeWorker } from "./utils";
import type { VersionPollingOptions } from "./types";

let APP_ETAG_KEY = "__APP_ETAG__";
let myWorker: Worker;
const defaultOptions: VersionPollingOptions = {
  appETagKey: APP_ETAG_KEY,
  pollingInterval: 5 * 60 * 1000, // 默认单位为毫秒
  htmlFileUrl: `${location.origin}${location.pathname}`,
  silent: false,
  silentPollingInterval: false,
  silentPageVisibility: false,
  forceUpdate: false,
};
let attached = false;

/**
 * 页面隐藏时停止轮询任务，页面再度可见时在继续
 */
function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    myWorker.postMessage({
      code: "resume",
    });
  } else {
    myWorker.postMessage({
      code: "pause",
    });
  }
}

export class VersionPolling {
  options: VersionPollingOptions;
  appEtag = "";

  constructor(options: VersionPollingOptions) {
    this.options = Object.assign({}, defaultOptions, options);

    this.init();
  }

  async init() {
    const { htmlFileUrl } = this.options;

    if (!htmlFileUrl) {
      throw new Error("[version-polling]: htmlFileUrl is required");
    }

    const response = await fetch(htmlFileUrl, {
      method: "HEAD",
      cache: "no-cache",
    });

    if (Number(response.status) !== 200) {
      throw new Error(`[version-polling]: status is ${response.status}`);
    }

    const etag = response.headers.get("etag");
    // eslint-disable-next-line no-eq-null
    if (etag == null) {
      throw new Error(`[version-polling]: etag is null`);
    }

    this.appEtag = etag;
    localStorage.setItem(`${this.options.appETagKey}`, etag);

    this.start();
  }

  start() {
    const {
      appETagKey,
      pollingInterval,
      htmlFileUrl,
      silent,
      silentPollingInterval,
      silentPageVisibility,
    } = this.options;

    if (silent) {
      return;
    }

    myWorker = createWorker(createWorkerFunc);

    myWorker.postMessage({
      code: "start",
      data: {
        appETagKey,
        pollingInterval,
        htmlFileUrl,
        silentPollingInterval,
        lastEtag: this.appEtag,
      },
    });

    myWorker.onmessage = (event) => {
      const { lastEtag, etag } = event.data;

      if (lastEtag !== etag) {
        this.stop();
        this.options.onUpdate?.(this);
      }
    };

    if (!silentPageVisibility) {
      if (!attached) {
        document.addEventListener("visibilitychange", handleVisibilityChange);
        attached = true;
      }
    }
  }

  stop() {
    if (myWorker) {
      closeWorker(myWorker);
      if (attached) {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        attached = false;
      }
    }
  }

  onRefresh() {
    window.location.reload();
  }

  onCancel() {
    this.options.forceUpdate && this.start();
  }
}

export function createVersionPolling(options: VersionPollingOptions) {
  const versionPolling = new VersionPolling(options);

  return versionPolling;
}
