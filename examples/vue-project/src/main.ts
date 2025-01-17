import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import './assets/main.css';

import { createVersionPolling } from 'version-polling';
// 安装调试本地 version-polling 包
createVersionPolling({
  // eventTriggerList: ['popstate'],
  pollingInterval: 5 * 1000,
  // silent: import.meta.env.MODE === 'development', // 开发环境下不检测
  onUpdate: (self) => {
    const result = confirm('页面有更新，点击确定刷新页面！');
    if (result) {
      self.onRefresh();
    } else {
      self.onCancel();
    }
  },
});

const app = createApp(App);

app.use(router);

app.mount('#app');
