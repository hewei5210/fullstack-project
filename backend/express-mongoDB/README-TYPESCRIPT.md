# Express MongoDB Backend - TypeScript版本

## 项目概述

这是Express MongoDB后端项目的TypeScript版本，提供了完整的类型安全和更好的开发体验。

## 项目结构

```
backend/express-mongoDB/
├── src/                    # TypeScript源代码
│   ├── types/             # 类型定义
│   ├── models/            # 数据模型
│   ├── routes/            # 路由处理
│   ├── services/          # 业务逻辑服务
│   └── middleware/        # 中间件
├── config/                # 配置文件
├── dist/                  # 编译后的JavaScript文件
├── tsconfig.json          # TypeScript配置
└── server.ts              # 主服务器文件
```

## 安装依赖

```bash
npm install
```

## 开发命令

### 开发模式（使用ts-node）
```bash
npm run dev
```

### 开发模式（带文件监听）
```bash
npm run dev:watch
```

### 编译TypeScript
```bash
npm run build
```

### 生产模式
```bash
npm start
```

## 主要特性

### 1. 完整的类型安全
- 所有接口和类型都有明确的TypeScript定义
- 编译时类型检查，减少运行时错误
- 更好的IDE支持和代码提示

### 2. 模块化架构
- 清晰的目录结构
- 分离的业务逻辑和路由处理
- 可重用的中间件和服务

### 3. 类型定义
- `IUser`: 用户模型接口
- `ITranslation`: 翻译项模型接口
- `IApiResponse`: 统一API响应格式
- `IAuthenticatedRequest`: 认证请求扩展

### 4. 主要功能
- 用户认证和授权
- 翻译项管理（CRUD操作）
- 数据导入导出（Excel/JSON）
- 搜索和分页
- 批量操作

## 环境变量

创建 `.env` 文件：

```env
MONGODB_URI=mongodb://localhost:27017/translation_db
JWT_SECRET=your_ultra_secure_secret
PORT=3000
```

## API端点

### 认证
- `POST /api/login` - 用户登录
- `POST /api/refresh` - 刷新token

### 翻译项管理
- `GET /api/getBingList` - 获取翻译列表
- `GET /api/search` - 搜索翻译项
- `POST /api/addBing` - 添加翻译项
- `PUT /api/updateBing` - 更新翻译项
- `DELETE /api/deleteBing/:id` - 删除翻译项

### 数据导出
- `GET /api/exportBing` - 导出JSON数据
- `GET /api/exportExcel` - 导出Excel数据
- `GET /api/downloadTemplate` - 下载模板

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:username` - 更新用户
- `DELETE /api/users/:username` - 删除用户

## 开发指南

### 添加新的API端点

1. 在 `src/types/index.ts` 中定义相关类型
2. 在 `src/services/` 中实现业务逻辑
3. 在 `src/routes/` 中添加路由处理
4. 在 `server.ts` 中注册路由

### 类型定义示例

```typescript
// 定义请求体类型
interface ICreateUserRequest {
  username: string;
  email?: string;
  password: string;
  role?: 'admin' | 'user';
}

// 定义响应类型
interface IUserResponse {
  id: string;
  username: string;
  email?: string;
  role: string;
  createdAt: Date;
}
```

## 迁移说明

从JavaScript版本迁移到TypeScript版本：

1. 所有 `.js` 文件已转换为 `.ts` 文件
2. 添加了完整的类型定义
3. 更新了package.json脚本
4. 保持了原有的API接口兼容性

## 注意事项

- 确保安装了所有必要的类型定义包
- 使用 `npm run build` 编译后再部署到生产环境
- 开发时推荐使用 `npm run dev:watch` 进行热重载
