import type { VersionPollingOptions } from "../types";

/**
 * 是否有值
 * @param {*} val
 */
export function isDef(val: any) {
  return val !== undefined && val !== null;
}

/**
 * 创建一个 Web Work 实例
 * @param func
 */
export function createWorker(func: (e: any) => void) {
  const blob = new Blob(["(" + func.toString() + ")()"]);
  const url = window.URL.createObjectURL(blob);
  const worker = new Worker(url);

  window.URL.revokeObjectURL(url);

  return worker;
}

export function createWorkerFunc() {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let options: Pick<
    VersionPollingOptions,
    "appETagKey" | "pollingInterval" | "silentPollingInterval"
  > & { htmlFileUrl: string; lastEtag: string };

  self.onmessage = (event: any) => {
    let code = event.data["code"];
    options = Object.assign({}, options, event.data["data"]);

    const {
      htmlFileUrl,
      lastEtag,
      appETagKey,
      pollingInterval,
      silentPollingInterval,
    } = options;

    const runReq = () => {
      fetch(htmlFileUrl, {
        method: "HEAD",
        cache: "no-cache",
      }).then((response) => {
        if (Number(response.status) !== 200) {
          return;
        }

        const etag = response.headers.get("etag");

        if (lastEtag !== etag) {
          self.postMessage({
            appETagKey,
            lastEtag,
            etag,
          });
        }
      });
    };

    const startPollingTask = () => {
      timerId = setInterval(runReq, pollingInterval);
    };

    const pausePollingTask = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    if (code === "pause") {
      pausePollingTask();
    } else {
      runReq(); // 立即执行一次
      if (!silentPollingInterval) {
        startPollingTask();
      }
    }
  };

  return self;
}

export function closeWorker(worker: Worker) {
  worker.terminate();
}
