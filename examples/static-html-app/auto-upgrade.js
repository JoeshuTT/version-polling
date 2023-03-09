(function () {
  var s, t;
  s = document.createElement("script");
  s.type = "text/javascript";
  s.async = true;
  s.id = "version-polling";
  s.src = "//unpkg.com/version-polling/dist/version-polling.min.js"; // 在生产环境下，最好是下载对应文件，并托管在你自己的服务器或 CDN 上
  t = document.getElementsByTagName("script")[0];
  t.parentNode.insertBefore(s, t);
  s.onload = function () {
    VersionPolling.createVersionPolling({
      appETagKey: "__APP_ETAG__",
      pollingInterval: 5 * 1000,
      onUpdate: (self) => {
        const result = confirm("页面有更新，点击确定刷新页面！");
        if (result) {
          self.onRefresh();
        }
      },
    });
  };
})(window);
