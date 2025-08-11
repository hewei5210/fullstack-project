const express = require('express');
const cors = require('cors');

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS配置
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 测试路由
app.get('/test', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Test route working',
    data: 'Hello World'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: '接口不存在',
    data: ''
  });
});

// 启动服务
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`测试服务器已启动，正在监听端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`测试路由: http://localhost:${PORT}/test`);
});
