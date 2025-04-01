const bingServer = require("./scripts/bing.js");

const express = require("express");
const app = express();

// 中间件：解析 JSON 请求体
app.use(express.json());

// 中间件：解析 URL 编码的表单数据（如 POST 表单）
app.use(express.urlencoded({ extended: true }));

// 定义 GET 接口 /api
app.get("/api", (req, res) => {
  const queryParams = req.query; // 获取查询参数
  res.json({
    message: "GET 请求成功",
    path: "/api",
    queryParams: queryParams,
  });
});

// 定义 POST 接口 /data
app.post("/data", (req, res) => {
  const postData = req.body; // 获取 POST 请求体
  res.json({
    message: "POST 请求成功",
    path: "/data",
    postData: postData,
  });
});

// 定义 PUT 接口 /update/:id
app.put("/update/:id", (req, res) => {
  const id = req.params.id; // 获取路径参数
  const updateData = req.body; // 获取更新数据
  res.json({
    message: "PUT 请求成功",
    path: `/update/${id}`,
    updatedData: updateData,
  });
});

// 定义 DELETE 接口 /delete/:id
app.delete("/delete/:id", (req, res) => {
  const id = req.params.id; // 获取路径参数
  res.json({
    message: "DELETE 请求成功",
    path: `/delete/${id}`,
    deletedId: id,
  });
});

// 启动服务器并监听端口
const PORT = 3000;

(async () => {
  await bingServer.init();

  app.listen(PORT, () => {
    console.log(`服务器已启动，正在监听端口 ${PORT}`);
  });
})();
