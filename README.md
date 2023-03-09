# version-polling

> 一个用于实时检测 web 应用更新的 JavaScript 库

以下内容是通过 NewBing 润色过的 😊

## 前言

version-polling 是一个轻量级的 JavaScript 库，它可以实时检测 web 应用的 index.html 文件内容是否有变化。当服务端发布新版本后，前端会自动弹出更新提示，让用户刷新页面，以加载最新的资源和功能。这样可以提高用户体验和数据准确性。

## 设计目的

为了解决后端部署之后，如何通知用户系统有新版本，并引导用户刷新页面以加载最新资源的问题。

## 适用场景

用户在浏览器中打开某 web 应用（通常是后台管理系统）很长时间且未刷新页面时，如果应用有新功能添加或问题修复，用户可能无法及时知道有新版发布。这样会导致用户继续使用旧版，影响用户体验和数据准确性，甚至出现程序报错。

## 功能特性

- 针对前端 web 单页应用而设计
- 纯前端技术实现，使用简单，不需要后端支持
- 支持 TypeScript

## 实现原理

1. 使用 `Web Worker` API 在浏览器后台**轮询**请求页面，不会影响主线程运行。
2. 命中协商缓存，对比本地和服务器请求**响应头`etag`字段**值。
3. 如果`etag`值不一致，说明有更新，则弹出更新提示，并引导用户手动**刷新页面**（例如弹窗提示），完成应用更新。
4. 当页面不可见时（例如切换标签页或最小化窗口），停止实时检测任务；再次可见时（例如切换回标签页或还原窗口），恢复实时检测任务。

## 浏览器兼容性

适用于支持原生 ES 模块的现代浏览器，具体可参考以下 [browserslist](https://github.com/browserslist/browserslist) 配置

```
defaults and supports es6-module
maintained node versions
```

## 安装

```shell
# 本地项目安装
npm version-polling --save
```

## 使用

- 通过 npm 引入，并通过构建工具进行打包

```javascript
// 在应用入口文件中使用: 如 main.js, app.jsx
import { createVersionPolling } from "version-polling";

createVersionPolling({
  appETagKey: "__APP_ETAG__",
  pollingInterval: 5 * 1000, // 单位为毫秒
  silent: process.env.NODE_ENV === "development", // 开发环境下不检测
  onUpdate: (self) => {
    // 当检测到有新版本时，执行的回调函数，可以在这里提示用户刷新页面
    const result = confirm("页面有更新，点击确定刷新页面！");
    if (result) {
      self.onRefresh();
    }
    // 强制更新可以用alert
    // alert('有新版本，请刷新页面');
  },
});
```

- 通过 script 引入，直接插入到 HTML
  > 无侵入用法，接入成本最低

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>前端页面自动检测更新-示例</title>
  </head>
  <body>
    <script src="//unpkg.com/version-polling/dist/version-polling.min.js"></script>
    <script>
      VersionPolling.createVersionPolling({
        appETagKey: "__APP_ETAG__",
        pollingInterval: 5 * 1000,
        onUpdate: (self) => {
          // 当检测到有新版本时，执行的回调函数，可以在这里提示用户刷新页面
          const result = confirm("页面有更新，点击确定刷新页面！");
          if (result) {
            self.onRefresh();
          }
        },
      });
    </script>
  </body>
</html>
```

## 最佳实践

在项目 index.html 下直接插入 script，类似于百度统计那种用法，具体代码参考`examples/static-html-app`目录下

## API

Options

| 参数            | 说明                                     | 类型         | 默认值                                   |
| --------------- | ---------------------------------------- | ------------ | ---------------------------------------- |
| appETagKey      | web 应用更新唯一标识字段名               | `string`     | `__APP_ETAG__`                           |
| pollingInterval | 轮询间隔，单位为毫秒，默认为 5 分钟      | `number`     | `5 * 60 * 1000 `                         |
| immediate       | 初始化后, 立即触发实时监测               | `boolean`    | `true`                                   |
| htmlFileUrl     | web 应用网站运行目录                     | `string`     | `${location.origin}${location.pathname}` |
| silent          | 安静模式，为`true`时，不会进行实时监测   | `boolean`    | `false`                                  |
| onUpdate        | 更新检测的回调函数，可以自定义更新的逻辑 | `() => void` | -                                        |

## 注意事项

- version-polling 需要在支持 web worker 和 fetchAPI 的浏览器中运行，不支持 IE 浏览器
- version-polling 需要在 web 应用的入口文件（通常是 index.html）中引入，否则无法检测到更新
- version-polling 需要在 web 应用的服务端配置协商缓存，否则无法命中缓存，会增加网络请求
- version-polling 需要在 web 应用的服务端保证每次发版后，index.html 文件的 etag 字段值会改变，否则无法检测到更新
