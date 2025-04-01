const express = require('express');
const app = express();

// 中间件配置
app.use(express.json());  // 解析JSON请求体[4](@ref)

// 示例路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', timestamp: new Date() });
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});