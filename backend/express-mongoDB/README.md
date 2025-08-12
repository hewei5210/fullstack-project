# Express MongoDB 后端服务

这是一个基于 Express.js 和 MongoDB 的后端 API 服务，为国际化平台提供数据管理和用户认证功能。

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env` 文件（可选，有默认值）：
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/translation_db
JWT_SECRET=your_ultra_secure_secret
NODE_ENV=development
```

### 数据库初始化
```bash
# 创建默认管理员用户
node scripts/init.js
```

### 启动服务
```bash
# 开发模式（使用 nodemon）
npm run dev

# 生产模式
npm start
```

## 📁 项目结构

```
express-mongoDB/
├── config/
│   └── database.js          # 数据库连接配置
├── scripts/
│   ├── init.js              # 数据库初始化脚本
│   ├── import-csv.js        # CSV数据导入脚本
│   ├── check-admin.js       # 检查管理员用户
│   └── check-data.js        # 检查数据状态
├── src/
│   ├── models/
│   │   ├── User.js          # 用户数据模型
│   │   └── Translation.js   # 翻译数据模型
│   ├── routes/
│   │   ├── auth.js          # 认证相关路由
│   │   └── translations.js  # 翻译管理路由
│   ├── services/
│   │   ├── authService.js   # 认证服务
│   │   └── translationService.js # 翻译管理服务
│   └── middleware/
│       └── auth.js          # JWT认证中间件
├── server.js                # 服务器入口文件
├── package.json
└── README.md
```

## 🔧 API 接口

### 认证接口
- `POST /api/login` - 用户登录

### 翻译管理接口
- `GET /api/translations/getBingList` - 获取翻译列表
- `GET /api/translations/search` - 搜索翻译项
- `POST /api/translations/applyId` - 应用ID
- `POST /api/translations/addBing` - 添加翻译项
- `PUT /api/translations/updateBing` - 更新翻译项
- `DELETE /api/translations/delBing` - 删除翻译项
- `POST /api/translations/batchUpload` - 批量上传
- `GET /api/translations/exportBing` - 导出翻译数据
- `GET /api/translations/downloadTemplate` - 下载模板

### 健康检查
- `GET /health` - 服务健康检查

## 👤 默认用户

- **用户名**: `admin`
- **密码**: `watermelon`
- **角色**: `admin`

## 🛠️ 开发工具

### 数据库脚本
```bash
# 初始化数据库和用户
node scripts/init.js

# 导入CSV数据到MongoDB
node scripts/import-csv.js

# 检查管理员用户状态
node scripts/check-admin.js

# 检查数据状态
node scripts/check-data.js
```

### 数据模型

#### User 模型
```javascript
{
  username: String,    // 用户名（唯一）
  email: String,       // 邮箱（唯一）
  password: String,    // 加密密码
  role: String,        // 用户角色
  createdAt: Date      // 创建时间
}
```

#### Translation 模型
```javascript
{
  id: String,          // 翻译ID（唯一）
  source: String,      // 源文本
  target: {            // 目标语言
    'zh-CN': String,   // 简体中文
    'zh-HK': String,   // 繁体中文
    'en-US': String    // 英文
  },
  status: String,      // 状态
  createdAt: Date,     // 创建时间
  updatedAt: Date      // 更新时间
}
```

## 🔒 安全特性

- JWT 令牌认证
- 密码 bcrypt 加密
- CORS 跨域配置
- 请求参数验证
- 错误处理中间件

## 📊 数据库

### MongoDB 连接
- 默认数据库: `translation_db`
- 连接字符串: `mongodb://localhost:27017/translation_db`
- 可通过环境变量 `MONGODB_URI` 自定义

### 索引
- `translations.id`: 唯一索引
- `users.username`: 唯一索引
- `users.email`: 唯一索引

## 🚨 故障排除

### 常见问题

1. **MongoDB 连接失败**
   ```bash
   # 检查 MongoDB 服务状态
   Get-Service -Name MongoDB
   
   # 启动 MongoDB 服务
   Start-Service MongoDB
   ```

2. **端口被占用**
   ```bash
   # 修改 .env 文件中的 PORT
   PORT=3001
   ```

3. **JWT 令牌无效**
   - 检查 `JWT_SECRET` 环境变量
   - 确保令牌未过期（默认2小时）

### 日志查看
```bash
# 开发模式日志
npm run dev

# 生产模式日志
npm start
```

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 用户认证系统
- 翻译管理功能
- CSV 数据导入导出
- JWT 令牌认证

## 📄 许可证

MIT License
