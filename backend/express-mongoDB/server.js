const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// 连接数据库
connectDB();

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

// 路由
app.use('/api', require('./src/routes/auth'));
app.use('/api', require('./src/routes/translations'));
app.use('/api/csv-sync', require('./src/routes/csvSync'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: '服务器内部错误',
    data: ''
  });
});

// 404处理 - 使用更简单的方式
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: '接口不存在',
    data: ''
  });
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动，正在监听端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});