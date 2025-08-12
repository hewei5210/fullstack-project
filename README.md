# 国际化平台 - 全栈项目

这是一个完整的国际化平台项目，包含前端 Vue 3 + TypeScript 应用和后端 Express + MongoDB API 服务。

## 🏗️ 项目架构

```
fullstack-project/
├── backend/
│   ├── express-mongoDB/     # Express + MongoDB 后端服务
│   └── node-csv-server/     # 原始 CSV 后端服务（已迁移）
├── frontend/
│   └── vite-vue3-ts/        # Vue 3 + TypeScript 前端应用
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm 或 yarn

### 1. 启动后端服务

```bash
# 进入后端目录
cd backend/express-mongoDB

# 安装依赖
npm install

# 初始化数据库（创建管理员用户）
node scripts/init.js

# 启动开发服务器
npm run dev
```

### 2. 启动前端服务

```bash
# 进入前端目录
cd frontend/vite-vue3-ts

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 访问应用

- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

### 4. 登录凭据

- **用户名**: `admin`
- **密码**: `watermelon`

## 📋 功能特性

### 前端功能
- 🏠 **首页** - 项目概览和快速导航
- 🌐 **国际化介绍** - 国际化概念和功能介绍
- 📜 **国际化脚本** - 自动化脚本工具
- 🔌 **国际化插件** - 框架插件展示
- 📝 **翻译项管理** - 翻译数据的增删改查
- 👥 **用户管理** - 用户账户管理
- 📋 **更新日志** - 版本更新记录

### 后端功能
- 🔐 **用户认证** - JWT 令牌认证系统
- 📊 **数据管理** - MongoDB 数据持久化
- 🔄 **API 接口** - RESTful API 设计
- 📁 **文件处理** - CSV/Excel 导入导出
- 🔍 **搜索功能** - 翻译项搜索
- 📦 **批量操作** - 批量导入导出

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **Vue Router** - 客户端路由
- **Element Plus** - Vue 3 UI 组件库
- **Axios** - HTTP 客户端

### 后端
- **Node.js** - JavaScript 运行时
- **Express.js** - Web 应用框架
- **MongoDB** - NoSQL 数据库
- **Mongoose** - MongoDB 对象建模
- **JWT** - JSON Web 令牌认证
- **bcryptjs** - 密码加密
- **Multer** - 文件上传处理
- **ExcelJS** - Excel 文件处理
- **PapaParse** - CSV 文件解析

## 📁 项目结构详解

### 后端结构
```
backend/express-mongoDB/
├── config/
│   └── database.js          # 数据库连接配置
├── scripts/
│   ├── init.js              # 数据库初始化
│   ├── import-csv.js        # CSV 数据导入
│   ├── check-admin.js       # 检查管理员用户
│   └── check-data.js        # 检查数据状态
├── src/
│   ├── models/              # 数据模型
│   │   ├── User.js          # 用户模型
│   │   └── Translation.js   # 翻译模型
│   ├── routes/              # 路由定义
│   │   ├── auth.js          # 认证路由
│   │   └── translations.js  # 翻译路由
│   ├── services/            # 业务逻辑
│   │   ├── authService.js   # 认证服务
│   │   └── translationService.js # 翻译服务
│   └── middleware/          # 中间件
│       └── auth.js          # JWT 认证中间件
├── server.js                # 服务器入口
└── package.json
```

### 前端结构
```
frontend/vite-vue3-ts/
├── src/
│   ├── components/          # 公共组件
│   │   └── MainLayout.vue   # 主布局
│   ├── views/               # 页面组件
│   │   ├── Home.vue         # 首页
│   │   ├── Login.vue        # 登录页
│   │   ├── i18n/           # 国际化页面
│   │   ├── user/           # 用户管理
│   │   └── changelog/      # 更新日志
│   ├── router/              # 路由配置
│   │   └── index.ts
│   ├── net/                 # 网络请求
│   │   └── http.ts
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── public/                  # 静态资源
├── index.html               # HTML 模板
└── package.json
```

## 🔧 开发指南

### 后端开发
1. **添加新 API 接口**
   - 在 `src/routes/` 中创建路由文件
   - 在 `src/services/` 中实现业务逻辑
   - 在 `server.js` 中注册路由

2. **数据库操作**
   - 在 `src/models/` 中定义数据模型
   - 使用 Mongoose 进行数据库操作
   - 创建数据库脚本在 `scripts/` 目录

3. **认证中间件**
   - 使用 `src/middleware/auth.js` 保护需要认证的路由
   - JWT 令牌自动验证

### 前端开发
1. **添加新页面**
   - 在 `src/views/` 中创建页面组件
   - 在 `src/router/index.ts` 中添加路由配置
   - 在 `src/components/MainLayout.vue` 中添加菜单项

2. **组件开发**
   - 使用 Vue 3 Composition API
   - TypeScript 类型定义
   - Element Plus 组件库

3. **网络请求**
   - 使用 `src/net/http.ts` 中的 Axios 实例
   - 自动处理 JWT 令牌和错误响应

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
   # 检查端口占用
   netstat -ano | findstr :3000
   netstat -ano | findstr :5173
   ```

3. **依赖安装失败**
   ```bash
   # 清除缓存重新安装
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### 开发工具

#### 后端工具
```bash
# 数据库初始化
node scripts/init.js

# 导入 CSV 数据
node scripts/import-csv.js

# 检查数据状态
node scripts/check-data.js
```

#### 前端工具
```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📦 部署指南

### 后端部署
1. 构建生产版本
2. 配置环境变量
3. 启动 MongoDB 服务
4. 运行数据库初始化脚本
5. 启动应用服务器

### 前端部署
1. 构建生产版本：`npm run build`
2. 将 `dist` 目录部署到 Web 服务器
3. 配置反向代理（如 Nginx）

## 🔄 数据迁移

### 从 CSV 迁移到 MongoDB
```bash
# 运行数据导入脚本
cd backend/express-mongoDB
node scripts/import-csv.js
```

### 数据备份
```bash
# MongoDB 数据备份
mongodump --db translation_db --out ./backup
```

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- 🎉 初始版本发布
- ✨ 完整的用户认证系统
- 🌐 国际化平台核心功能
- 📊 翻译数据管理
- 🔧 前后端分离架构
- 📱 响应式用户界面

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 创建 Issue
- 发送邮件
- 提交 Pull Request

---

**注意**: 这是一个开发中的项目，功能可能会持续更新和改进。 