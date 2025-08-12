# Vue 3 + Vite + TypeScript 前端应用

这是一个基于 Vue 3、Vite 和 TypeScript 的现代化前端应用，为国际化平台提供用户界面。

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 📁 项目结构

```
vite-vue3-ts/
├── public/                    # 静态资源
│   ├── bianmu.svg
│   ├── hashiqi.svg
│   ├── party_popper_color.svg
│   ├── partying_face_color.svg
│   ├── siguniang.jpg
│   ├── tianyuanquan.svg
│   ├── vite.svg
│   ├── zany_face_color.svg
│   └── 猫偷鱼.png
├── src/
│   ├── assets/               # 资源文件
│   │   └── vue.svg
│   ├── components/           # 公共组件
│   │   └── MainLayout.vue    # 主布局组件
│   ├── net/                  # 网络请求
│   │   └── http.ts          # Axios 配置
│   ├── router/              # 路由配置
│   │   └── index.ts         # Vue Router 配置
│   ├── views/               # 页面组件
│   │   ├── Home.vue         # 首页
│   │   ├── Login.vue        # 登录页
│   │   ├── i18n/           # 国际化相关页面
│   │   │   ├── Intro.vue    # 国际化介绍
│   │   │   ├── Script.vue   # 国际化脚本
│   │   │   ├── Plugin.vue   # 国际化插件
│   │   │   └── Translation/ # 翻译项管理
│   │   │       ├── index.vue
│   │   │       └── components/
│   │   │           ├── addId.vue
│   │   │           ├── addBatchId.vue
│   │   │           ├── editId.vue
│   │   │           ├── deleteId.vue
│   │   │           └── exportDialog.vue
│   │   ├── user/            # 用户管理
│   │   │   └── index.vue
│   │   └── changelog/       # 更新日志
│   │       └── index.vue
│   ├── App.vue              # 根组件
│   ├── main.ts              # 应用入口
│   └── style.css            # 全局样式
├── index.html               # HTML 模板
├── package.json
├── tsconfig.json            # TypeScript 配置
├── tsconfig.app.json        # 应用 TypeScript 配置
├── tsconfig.node.json       # Node.js TypeScript 配置
├── vite.config.ts           # Vite 配置
└── README.md
```

## 🎯 功能特性

### 用户界面
- **响应式设计** - 适配不同屏幕尺寸
- **现代化 UI** - 基于 Element Plus 组件库
- **多级菜单** - 支持一级和二级菜单导航
- **主题定制** - 可自定义主题色彩

### 页面功能
- **首页** - 项目概览和快速导航
- **国际化介绍** - 国际化概念和功能介绍
- **国际化脚本** - 自动化脚本工具
- **国际化插件** - 框架插件展示
- **翻译项管理** - 翻译数据的增删改查
- **用户管理** - 用户账户管理
- **更新日志** - 版本更新记录

### 技术特性
- **TypeScript** - 类型安全的 JavaScript
- **Vue 3 Composition API** - 现代化的 Vue 开发方式
- **Vite** - 快速的构建工具
- **Vue Router** - 客户端路由
- **Element Plus** - Vue 3 UI 组件库
- **Axios** - HTTP 客户端

## 🔧 配置说明

### Vite 配置
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

### TypeScript 配置
```json
// tsconfig.app.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "module": "esnext"
  }
}
```

### 路由配置
```typescript
// src/router/index.ts
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'i18n/intro', component: Intro },
      { path: 'i18n/script', component: Script },
      { path: 'i18n/plugin', component: Plugin },
      { path: 'i18n/translation', component: Translation },
      { path: 'user', component: User },
      { path: 'changelog', component: Changelog }
    ]
  }
]
```

## 🎨 组件说明

### MainLayout.vue
主布局组件，包含：
- 侧边栏导航菜单
- 顶部导航栏
- 内容区域
- 多级菜单支持

### 翻译管理组件
- `addId.vue` - 添加单个翻译项
- `addBatchId.vue` - 批量添加翻译项
- `editId.vue` - 编辑翻译项
- `deleteId.vue` - 删除翻译项
- `exportDialog.vue` - 导出对话框

## 🌐 网络请求

### HTTP 配置
```typescript
// src/net/http.ts
const service = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})
```

### 请求拦截器
- 自动添加 JWT 令牌
- 请求参数处理
- 错误处理

### 响应拦截器
- 统一响应格式处理
- 错误消息提示
- 登录状态检查

## 🔐 认证系统

### 登录流程
1. 用户输入用户名和密码
2. 前端发送登录请求到后端
3. 后端验证凭据并返回 JWT 令牌
4. 前端保存令牌到 localStorage
5. 后续请求自动携带令牌

### 路由守卫
- 检查登录状态
- 未登录自动跳转到登录页
- 已登录用户访问登录页自动跳转到首页

## 📱 响应式设计

### 断点设置
- 移动端: < 768px
- 平板端: 768px - 1024px
- 桌面端: > 1024px

### 适配策略
- 移动端菜单折叠
- 表格响应式布局
- 图片自适应缩放

## 🚨 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 清除缓存重新安装
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript 类型错误**
   ```bash
   # 检查类型定义
   npm run type-check
   ```

3. **构建失败**
   ```bash
   # 清理构建缓存
   npm run build -- --force
   ```

4. **开发服务器启动失败**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :5173
   ```

### 开发工具

#### 代码检查
```bash
# ESLint 检查
npm run lint

# TypeScript 类型检查
npm run type-check
```

#### 格式化代码
```bash
# Prettier 格式化
npm run format
```

## 📦 构建部署

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

### 部署到服务器
```bash
# 构建生产版本
npm run build

# 将 dist 目录部署到 Web 服务器
```

## 🔄 开发工作流

1. **功能开发**
   - 创建新分支
   - 开发功能
   - 编写测试
   - 提交代码

2. **代码审查**
   - 创建 Pull Request
   - 代码审查
   - 合并到主分支

3. **部署发布**
   - 构建生产版本
   - 部署到服务器
   - 验证功能

## 📝 更新日志

### v1.0.0
- 初始版本发布
- Vue 3 + TypeScript 架构
- Element Plus UI 组件
- 多级菜单导航
- 翻译管理功能
- 用户认证系统

## �� 许可证

MIT License
