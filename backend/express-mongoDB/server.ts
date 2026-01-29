import express from "express";
import cors from "cors";
import connectDB from "./config/database";
import dotenv from "dotenv";

// 导入路由
import authRoutes from "./src/routes/auth";
import userRoutes from "./src/routes/users";
import translationRoutes from "./src/routes/translations";
import csvSyncRoutes from "./src/routes/csvSync";

// 加载环境变量
dotenv.config();

const app = express();

// 连接数据库
connectDB();

// 中间件配置
// 增加 body parser 大小限制，支持大文件上传（50MB）
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS配置
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://223.6.250.152",
      "https://223.6.250.152",
      "https://frontendtool.top",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 健康检查
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 路由
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", translationRoutes);
app.use("/api/csv-sync", csvSyncRoutes);

// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: "服务器内部错误",
    data: "",
  });
});

// 404处理
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    status: 404,
    message: "接口不存在",
    data: "",
  });
});

// 启动服务
const PORT = process.env.PORT || 3000;
console.log('正在启动服务器...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已设置' : '未设置');
console.log('PORT:', PORT);

app.listen(PORT, () => {
  console.log(`服务器已启动，正在监听端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});
