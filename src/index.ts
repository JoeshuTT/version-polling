import {
  closeWorker,
  compareSemanticVersion,
  createWorker,
  noop,
} from './utils';

export type VcType = 'etag' | 'chunkHash' | 'versionJson';

export interface VersionPollingOptions {
  vcType?: VcType;
  htmlFileUrl?: string;
  chunkName?: string;
  versionFileUrl?: string;
  eventTriggerList?: string[];
  pollingInterval?: number;
  silent?: boolean;
  silentPollingInterval?: boolean;
  silentPageVisibility?: boolean;
  onUpdate: (self: VersionPolling, info?: object) => void;
}

export type WorkerGlobalData = Pick<
  VersionPollingOptions,
  | 'vcType'
  | 'htmlFileUrl'
  | 'chunkName'
  | 'versionFileUrl'
  | 'pollingInterval'
  | 'silentPollingInterval'
>;

export type VersionControl = {
  versionFlag: string;
  start: () => Promise<void>;
  check: () => Promise<void>;
  fetchEtag: () => Promise<{ versionFlag: string }>;
  fetchChunkHash: () => Promise<{ versionFlag: string }>;
  fetchVersionFile: () => Promise<{
    versionFlag: string;
    versionInfo?: object;
  }>;
  pausePolling: () => void;
  startPolling: () => void;
};

const DEFAULT_OPTIONS = {
  vcType: 'etag',
  htmlFileUrl: `${location.origin}${location.pathname}`,
  chunkName: 'index',
  versionFileUrl: `${location.origin}${location.pathname}version.json`,
  eventTriggerList: [],
  pollingInterval: 5 * 60 * 1000, // 默认单位为毫秒
  silent: false,
  silentPollingInterval: false,
  silentPageVisibility: false,
  onUpdate: noop,
};

export class VersionPolling {
  options;
  worker: Worker | undefined;

  visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      this.worker?.postMessage({
        code: 'resume',
      });
    } else {
      this.worker?.postMessage({
        code: 'pause',
      });
    }
  };

  eventHandler = () => {
    this.worker?.postMessage({
      code: 'check',
    });
  };

  constructor(options: VersionPollingOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.start();
  }

  start() {
    const { eventTriggerList, silent, silentPageVisibility } = this.options;

    if (silent) {
      return;
    }

    // web worker 脚本代码降级到es6，避免打包出现兼容问题。
    this.worker = createWorker(() => {
      let timerId: ReturnType<typeof setTimeout> | null = null;
      let globalData: WorkerGlobalData;
      let versionControl: VersionControl;
      const versionControlMap = new Map();
      versionControlMap.set('etag', {
        start: () => {
          versionControl.fetchEtag().then((res) => {
            versionControl.versionFlag = res.versionFlag;
          });
        },
        check: () => {
          versionControl.fetchEtag().then((res) => {
            if (res.versionFlag !== versionControl.versionFlag) {
              self.postMessage({
                code: 'update',
                data: {
                  versionFlag: res.versionFlag,
                  localVersionFlag: versionControl.versionFlag,
                },
              });
            }
          });
        },
        fetchEtag: () => {
          if (!globalData.htmlFileUrl) {
            throw new Error('[version-polling]: htmlFileUrl is required');
          }
          return fetch(globalData.htmlFileUrl, {
            method: 'HEAD',
            cache: 'no-cache',
          }).then((response) => {
            const etag = response.headers.get('etag');
            if (!etag) {
              throw new Error('[version-polling]: etag is null');
            }
            return {
              versionFlag: etag,
            };
          });
        },
      });
      versionControlMap.set('chunkHash', {
        start: () => {
          versionControl.fetchChunkHash().then((res) => {
            versionControl.versionFlag = res.versionFlag;
          });
        },
        check: () => {
          versionControl.fetchChunkHash().then((res) => {
            if (res.versionFlag !== versionControl.versionFlag) {
              self.postMessage({
                code: 'update',
                data: {
                  versionFlag: res.versionFlag,
                  localVersionFlag: versionControl.versionFlag,
                },
              });
            }
          });
        },
        fetchChunkHash: () => {
          if (!globalData.htmlFileUrl) {
            throw new Error('[version-polling]: htmlFileUrl is required');
          }
          return fetch(`${globalData.htmlFileUrl}?t=${+new Date()}`)
            .then((response) => response.text())
            .then((response) => {
              const getChunkByHtml = (htmlText: string, name = 'index') => {
                const chunkRegExp = new RegExp(
                  `<script(?:.*)src=(?:["']?)(.*?${name}.*?)(?:["']?)>`,
                  's',
                );
                const [, src] = htmlText.match(chunkRegExp) || [];
                return src;
              };
              const chunkHash = getChunkByHtml(response, globalData.chunkName);
              if (!chunkHash) {
                throw new Error('[version-polling]: chunkHash is null');
              }
              return {
                versionFlag: chunkHash,
              };
            });
        },
      });
      versionControlMap.set('versionJson', {
        start: () => {
          versionControl.fetchVersionFile().then((res) => {
            versionControl.versionFlag = res.versionFlag;
          });
        },
        check: () => {
          versionControl.fetchVersionFile().then((res) => {
            if (res.versionFlag !== versionControl.versionFlag) {
              self.postMessage({
                code: 'update',
                data: {
                  versionFlag: res.versionFlag,
                  versionInfo: res.versionInfo,
                  localVersionFlag: versionControl.versionFlag,
                },
              });
            }
          });
        },
        fetchVersionFile: () => {
          if (!globalData.versionFileUrl) {
            throw new Error('[version-polling]: versionFileUrl is required');
          }
          return fetch(`${globalData.versionFileUrl}?t=${+new Date()}`)
            .then((response) => response.json())
            .then((response) => {
              const { version } = response;
              if (!version) {
                throw new Error('[version-polling]: version is null');
              }
              return {
                versionFlag: version,
                versionInfo: response,
              };
            });
        },
      });

      self.onmessage = (event: MessageEvent) => {
        const { code, data } = event.data;

        if (code === 'start') {
          globalData = data;
          const current = versionControlMap.get(globalData.vcType);
          if (!current) {
            throw new Error(
              `[version-polling]: invalid vcType: ${globalData.vcType}`,
            );
          }
          versionControl = Object.assign(current, {
            startPolling: () => {
              timerId = setInterval(
                versionControl.check,
                globalData.pollingInterval,
              );
            },
            pausePolling: () => {
              if (timerId) {
                clearInterval(timerId);
                timerId = null;
              }
            },
          });
          versionControl.start();
          if (!globalData.silentPollingInterval) {
            versionControl.startPolling();
          }
        } else if (code === 'pause') {
          versionControl.pausePolling();
        } else if (code === 'resume') {
          versionControl.check();
          if (!globalData.silentPollingInterval) {
            versionControl.startPolling();
          }
        } else {
          versionControl.check();
        }
      };
    });

    this.worker.onmessage = (event: MessageEvent) => {
      const { code, data } = event.data;

      if (code === 'update') {
        let promptUpdate = true;
        const { vcType } = this.options;
        if (vcType === 'versionJson') {
          promptUpdate =
            compareSemanticVersion(data.versionFlag, data.localVersionFlag) ===
            1;
        }
        if (promptUpdate) {
          this.stop();
          this.options.onUpdate?.(this, data.versionInfo);
        }
      }
    };

    this.worker.postMessage({
      code: 'start',
      data: {
        vcType: this.options.vcType,
        htmlFileUrl: this.options.htmlFileUrl,
        chunkName: this.options.chunkName,
        versionFileUrl: this.options.versionFileUrl,
        pollingInterval: this.options.pollingInterval,
        silentPollingInterval: this.options.silentPollingInterval,
      },
    });

    if (!silentPageVisibility) {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    if (eventTriggerList?.length) {
      for (const type of eventTriggerList) {
        window.addEventListener(type, this.eventHandler);
      }
    }
  }

  stop() {
    const { eventTriggerList, silentPageVisibility } = this.options;

    if (this.worker) {
      closeWorker(this.worker);

      if (!silentPageVisibility) {
        document.removeEventListener(
          'visibilitychange',
          this.visibilityHandler,
        );
      }

      if (eventTriggerList?.length) {
        for (const type of eventTriggerList) {
          window.removeEventListener(type, this.eventHandler);
        }
      }
    }
  }

  onRefresh() {
    window.location.reload();
  }

  onCancel() {
    setTimeout(() => {
      this.start();
    }, 30);
  }
}

/**
 * Creates a VersionPolling instance
 *
 * @param options
 */
export function createVersionPolling(options: VersionPollingOptions) {
  const versionPolling = new VersionPolling(options);

  return versionPolling;
}
