/*!
  * version-polling v1.0.0
  * (c) 2023 JoeshuTT
  * @license MIT
  */
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}

/**
 * 是否有值
 * @param {*} val
 */
/**
 * 创建一个 Web Work 实例
 * @param func
 */
function createWorker(func) {
  const blob = new Blob(["(" + func.toString() + ")()"]);
  const url = window.URL.createObjectURL(blob);
  const worker = new Worker(url);
  window.URL.revokeObjectURL(url);
  return worker;
}
function createWorkerFunc() {
  let timer;
  let options;
  self.onmessage = event => {
    let code = event.data["code"];
    options = Object.assign({}, options, event.data["data"]);
    const {
      htmlFileUrl,
      lastEtag,
      appETagKey,
      immediate,
      pollingInterval
    } = options;
    const runReq = () => {
      fetch(htmlFileUrl, {
        method: "HEAD",
        cache: "no-cache"
      }).then(response => {
        const etag = response.headers.get("etag");
        if (lastEtag !== etag) {
          self.postMessage({
            appETagKey,
            lastEtag,
            etag
          });
        }
      });
    };
    if (code === "pause") {
      clearInterval(timer);
      timer = null;
    } else {
      immediate && runReq();
      timer = setInterval(runReq, pollingInterval);
    }
  };
  return self;
}
function closeWorker(worker) {
  worker.terminate();
}

let APP_ETAG_KEY = "__APP_ETAG__";
let myWorker;
class VersionPolling {
  constructor(options) {
    _defineProperty(this, "options", void 0);
    _defineProperty(this, "appEtag", "");
    this.options = options;
    this.init();
  }
  async init() {
    const {
      appETagKey = APP_ETAG_KEY,
      pollingInterval = 5 * 60 * 1000,
      // 默认单位为毫秒
      immediate = true,
      htmlFileUrl = `${location.origin}${location.pathname}`,
      silent = false
    } = this.options;
    const lastEtag = localStorage.getItem(`${appETagKey}`);
    if (!lastEtag) {
      const response = await fetch(htmlFileUrl, {
        method: "HEAD",
        cache: "no-cache"
      });
      const etag = response.headers.get("etag");
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
        lastEtag: localStorage.getItem(`${appETagKey}`)
      }
    });
    myWorker.onmessage = event => {
      const {
        lastEtag,
        etag
      } = event.data;
      this.appEtag = etag;
      if (lastEtag !== etag) {
        var _this$options$onUpdat, _this$options;
        closeWorker(myWorker);
        (_this$options$onUpdat = (_this$options = this.options).onUpdate) === null || _this$options$onUpdat === void 0 ? void 0 : _this$options$onUpdat.call(_this$options, this);
      }
    };
    // 页面隐藏时停止轮询任务，页面再度可见时在继续
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        myWorker.postMessage({
          code: "pause"
        });
      } else {
        myWorker.postMessage({
          code: "resume"
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
function createVersionPolling(options) {
  const versionPolling = new VersionPolling(options);
  return versionPolling;
}

export { VersionPolling, createVersionPolling };
