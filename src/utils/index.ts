export const noop = () => {};

/**
 * 是否有值
 */
export function isDef(val: unknown) {
  return val !== undefined && val !== null;
}

/**
 * 从HTML内容中提取指定chunk
 */
export function getChunkByHtml(htmlText: string, name = 'index') {
  const chunkRegExp = new RegExp(
    `<script(?:.*)src=(?:["']?)(.*?${name}.*?)(?:["']?)>`,
    's',
  );
  const [, src] = htmlText.match(chunkRegExp) || [];
  return src;
}

/**
 * 比较两个版本号的大小
 * @param v1 最新版本，格式为数字点分隔的字符串，如 '1.2.3'
 * @param v2 旧版本，格式同v1
 * @see https://semver.org/lang/zh-CN/
 */
export function compareSemanticVersion(v1: string, v2: string) {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  const len = Math.max(v1Parts.length, v2Parts.length);
  for (let i = 0; i < len; i++) {
    const v1 = v1Parts[i] || 0;
    const v2 = v2Parts[i] || 0;

    if (v1 > v2) return 1;
    if (v1 < v2) return -1;
  }

  return 0;
}

export function createWorker(fn: () => void) {
  const blob = new Blob([`(${fn.toString()})()`], {
    type: 'text/javascript',
  });
  const url = window.URL.createObjectURL(blob);
  const worker = new Worker(url);
  window.URL.revokeObjectURL(url);
  return worker;
}

export function closeWorker(worker: Worker) {
  worker.terminate();
}
