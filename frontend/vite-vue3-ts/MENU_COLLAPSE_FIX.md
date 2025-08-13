# 菜单折叠修复说明

## 问题描述

在切换菜单时，已经打开的二级菜单不会自动折叠，导致用户体验不佳。

## 解决方案

### 1. 添加菜单展开状态管理

```typescript
// 添加响应式的菜单展开状态
const openedMenus = ref<string[]>([]);
```

### 2. 路由监听机制

```typescript
// 监听路由变化，动态控制菜单展开状态
watch(
  () => router.currentRoute.value.path,
  (newPath) => {
    if (newPath.startsWith('/console/i18n')) {
      // 如果访问国际化相关页面，确保国际化菜单展开
      if (!openedMenus.value.includes('/console/i18n')) {
        openedMenus.value = ['/console/i18n'];
      }
    } else {
      // 如果访问其他页面，关闭国际化菜单
      openedMenus.value = openedMenus.value.filter(menu => menu !== '/console/i18n');
    }
  },
  { immediate: true }
);
```

### 3. 菜单选择处理

```typescript
// 菜单选择处理
const handleMenuSelect = (index: string) => {
  // 根据选择的菜单项动态控制展开状态
  if (index.startsWith('/console/i18n/')) {
    // 选择国际化子菜单项，确保父菜单展开
    if (!openedMenus.value.includes('/console/i18n')) {
      openedMenus.value = ['/console/i18n'];
    }
  } else if (index === '/console/i18n') {
    // 选择国际化父菜单，切换展开状态
    if (openedMenus.value.includes('/console/i18n')) {
      openedMenus.value = openedMenus.value.filter(menu => menu !== '/console/i18n');
    } else {
      openedMenus.value = ['/console/i18n'];
    }
  } else {
    // 选择其他菜单项，关闭国际化菜单
    openedMenus.value = openedMenus.value.filter(menu => menu !== '/console/i18n');
  }
};
```

### 4. 菜单组件配置

```vue
<el-menu
  router
  :default-active="$route.path"
  background-color="#f8fafc"
  text-color="#475569"
  :collapse="isCollapse"
  :popper-append-to-body="false"
  :unique-opened="true"
  :default-openeds="openedMenus"
  @select="handleMenuSelect"
>
```

## 功能特性

### ✅ 自动展开/折叠
- 当访问国际化相关页面时，自动展开国际化菜单
- 当访问其他页面时，自动折叠国际化菜单

### ✅ 手动控制
- 点击国际化父菜单可以手动切换展开/折叠状态
- 点击子菜单项时确保父菜单保持展开

### ✅ 响应式更新
- 使用Vue 3的响应式系统，确保状态变化时UI及时更新
- 路由变化时自动调整菜单状态

## 技术实现

### 核心概念
1. **响应式状态管理**: 使用`ref`创建响应式的菜单展开状态
2. **路由监听**: 使用`watch`监听路由变化
3. **事件处理**: 处理菜单选择事件，动态控制展开状态
4. **Element Plus集成**: 通过`:default-openeds`属性控制菜单展开

### 依赖项
- Vue 3 Composition API (`ref`, `watch`)
- Vue Router (`useRouter`)
- Element Plus (`el-menu`)

## 测试验证

### 测试场景
1. **从首页切换到国际化页面**
   - 国际化菜单应该自动展开

2. **在国际化子菜单间切换**
   - 父菜单应该保持展开状态

3. **从国际化页面切换到其他页面**
   - 国际化菜单应该自动折叠

4. **手动点击国际化父菜单**
   - 应该能够切换展开/折叠状态

### 构建验证
```bash
npm run build
# ✅ 构建成功，无TypeScript错误
```

## 文件修改

### 主要修改文件
- `src/components/MainLayout.vue`

### 修改内容
1. 添加`openedMenus`响应式状态
2. 添加路由监听逻辑
3. 更新菜单选择处理函数
4. 配置菜单组件的`:default-openeds`属性

## 兼容性

- ✅ Vue 3.0+
- ✅ Element Plus 2.0+
- ✅ TypeScript 4.0+
- ✅ 现代浏览器

## 后续优化建议

1. **多级菜单支持**: 扩展支持更多层级的菜单结构
2. **状态持久化**: 可以考虑将菜单展开状态保存到localStorage
3. **动画优化**: 添加菜单展开/折叠的过渡动画
4. **键盘导航**: 支持键盘快捷键控制菜单展开

---

**修复时间**: 2024-08-13  
**状态**: ✅ 完成  
**测试**: ✅ 通过
