import { createRouter, createWebHistory } from "vue-router";
import tokenManager from "@/utils/tokenManager";

const routes = [
  {
    path: "/",
    redirect: () => {
      // 检查是否已登录
      const user = tokenManager.getUser();
      if (user) {
        return "/console/i18n/translation";
      }
      return "/login";
    },
  },
  {
    path: "/login",
    component: () => import("@/views/login.vue"),
  },
  {
    path: "/console",
    component: () => import("@/components/MainLayout.vue"),
    meta: { title: "控制台" },
    children: [
      {
        path: "home",
        name: "Home",
        component: () => import("@/views/Home.vue"),
        meta: { title: "首页" },
      },
      // 项目国际化相关路由
      {
        path: "i18n",
        meta: { title: "项目国际化" },
        children: [
          {
            path: "intro",
            component: () => import("@/views/i18n/introduce.vue"),
            meta: { title: "国际化介绍" },
          },
          {
            path: "script",
            component: () => import("@/views/i18n/script/index.vue"),
            meta: { title: "国际化脚本" },
          },
          {
            path: "plugin",
            component: () => import("@/views/i18n/plugin.vue"),
            meta: { title: "国际化插件" },
          },
          {
            path: "translation",
            component: () => import("@/views/i18n/translation/index.vue"),
            meta: { title: "翻译项管理" },
          },
          // 翻译项自动化功能暂未开放
          {
            path: "translation-auto",
            component: () => import("@/views/i18n/translation-auto/index.vue"),
            meta: { title: "翻译项自动化" },
          },
        ],
      },
      // 用户管理
      {
        path: "user",
        component: () => import("@/views/user/index.vue"),
        meta: { title: "用户管理" },
      },
      // AI API管理
      {
        path: "ai-api",
        component: () => import("@/views/ai-api/index.vue"),
        meta: { title: "AI API管理" },
      },
      // 更新日志
      // {
      //   path: "changelog",
      //   component: () => import("@/views/changelog/index.vue"),
      //   meta: { title: "更新日志" },
      // },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局前置守卫（必须写在导出之前）
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 前端工具平台`;
  }

  // 对于登录和刷新token的请求，直接通过
  if (to.path === "/login" || to.path.includes('/refresh')) {
    next();
    return;
  }

  try {
    // 尝试获取有效的token（如果即将过期则自动刷新）
    const token = await tokenManager.getValidToken();
    const isAuthenticated = !!token;

    // 已登录时禁止访问登录页（避免循环）
    if (isAuthenticated && to.path === "/login") {
      next("/console/i18n/translation"); // 重定向到翻译项管理页面
      return;
    }

    // 检查是否需要登录
    if (!isAuthenticated && to.path.startsWith("/console")) {
      next("/login");
      return;
    }

    next();
  } catch (error) {
    console.error('路由守卫认证检查失败:', error);
    // 认证失败，跳转到登录页
    next("/login");
  }
});

export default router;
