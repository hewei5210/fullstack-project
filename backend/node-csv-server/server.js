const express = require("express");
const path = require("path");
const bingServer = require("./scripts/bing.js");
const interfaceServer = require("./interface/index.js");

const app = express();

// 静态资源目录
const staticDir = path.join(__dirname, "../frontend/dist");

// 中间件：解析 JSON 请求体
app.use(express.json());

// 中间件：解析 URL 编码的表单数据（如 POST 表单）
app.use(express.urlencoded({ extended: true }));

// web 路径转发到静态资源提供服务
app.use("/web", express.static(staticDir));

// api 路径转发到接口服务
app.use("/api", (req, res) => interfaceServer(req, res));

// 启动服务器并监听端口
const PORT = 3000;

(async () => {
  await bingServer.init(); // 存储初始化

  app.listen(PORT, () => {
    console.log(`服务器已启动，正在监听端口 ${PORT}`);
  });
})();
