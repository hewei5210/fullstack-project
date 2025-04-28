import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    component: () => import("@/views/Login.vue"),
  },
  {
    path: "/console",
    component: () => import("@/components/MainLayout.vue"),
    children: [
      {
        path: "home",
        component: () => import("@/views/Home.vue"),
      },
      {
        path: "id",
        component: () => import("@/views/id/index.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局前置守卫（必须写在导出之前）
router.beforeEach((to, from, next) => {
  console.log('全局前置守卫', to, from)
  const isAuthenticated = localStorage.getItem('token')
  
  // 已登录时禁止访问登录页（避免循环）
  if (isAuthenticated && to.path === '/login') {
    next('/console/home') // 重定向到控制台首页
    return
  }
  next()
})

export default router;