import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
// Element Plus的Message组件依赖其专用样式文件，若未正确引入会导致弹窗无法渲染。
import "element-plus/theme-chalk/el-message.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import autoRefreshManager from "./utils/autoRefresh";

const app = createApp(App);
app.use(ElementPlus, { locale: zhCn });
app.use(router);

// 启动token自动刷新
autoRefreshManager.start();

app.mount("#app");
