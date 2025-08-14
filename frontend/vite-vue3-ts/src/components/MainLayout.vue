<template>
  <el-container class="common-layout" style="height: 100vh">
    <el-header style="font-size: 12px">
      <div class="header-content">
        <div class="logo">
          <h2>前端工具平台</h2>
        </div>
        <div class="toolbar">
          <div
            class="user-wrapper"
            @mouseenter="showDropdown = true"
            @mouseleave="handleMouseLeave"
          >
            <el-avatar :size="30" src="../../public/party_popper_color.svg" />
            <span style="margin-left: 10px">{{ username }}</span>

            <!-- 下拉菜单 -->
            <transition name="el-zoom-in-top">
              <div
                v-show="showDropdown"
                class="dropdown-menu"
                @mouseenter="clearCloseTimer"
                @mouseleave="startCloseTimer"
              >
                <div class="menu-item" @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </el-header>
    <el-container>
      <el-aside :width="isCollapse ? '64px' : '250px'" style="background: #f8fafc; transition: width 0.3s ease;">
        <div class="collapse-trigger" @click="toggleCollapse">
          <el-icon :class="{ 'is-collapsed': isCollapse }">
            <ArrowLeft />
          </el-icon>
        </div>
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
          <!-- 首页 -->
          <el-menu-item index="/console/home">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>

          <!-- 项目国际化 -->
          <el-sub-menu index="/console/i18n">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>项目国际化</span>
            </template>
            <el-menu-item index="/console/i18n/intro">
              <el-icon><Document /></el-icon>
              <span>国际化介绍</span>
            </el-menu-item>
            <el-menu-item index="/console/i18n/script">
              <el-icon><Tools /></el-icon>
              <span>国际化脚本</span>
            </el-menu-item>
            <el-menu-item index="/console/i18n/plugin">
              <el-icon><Connection /></el-icon>
              <span>国际化插件</span>
            </el-menu-item>
            <el-menu-item index="/console/i18n/translation">
              <el-icon><List /></el-icon>
              <span>翻译项管理</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 用户管理 -->
          <el-menu-item index="/console/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>

          <!-- 更新日志 -->
          <el-menu-item index="/console/changelog">
            <el-icon><Clock /></el-icon>
            <span>更新日志</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <!-- 面包屑导航 -->
        <div class="breadcrumb-container">
          <Breadcrumb />
        </div>
        <!-- 页面内容 -->
        <div class="main-content">
          <router-view v-slot="{ Component, route }">
            <keep-alive>
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { 
  SwitchButton, 
  House, 
  Document, 
  Tools, 
  Connection, 
  List, 
  User, 
  Clock,
  ArrowLeft
} from "@element-plus/icons-vue";
import tokenManager from "@/utils/tokenManager";

// 获取用户名
const username = computed(() => {
  try {
    const user = tokenManager.getUser();
    return user?.username || '';
  } catch (error) {
    console.error('获取用户名失败:', error);
    return '';
  }
});

// 使用异步组件，添加加载和错误处理
const Breadcrumb = defineAsyncComponent({
  loader: () => import("./Breadcrumb.vue"),
  delay: 0,
  timeout: 3000
});

const router = useRouter();
const showDropdown = ref(false);
const isCollapse = ref(false);
const openedMenus = ref<string[]>([]);
let closeTimer: number | null = null;



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

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

// 鼠标离开容器
const handleMouseLeave = () => {
  startCloseTimer();
};

// 启动关闭定时器（500ms延迟）
const startCloseTimer = () => {
  closeTimer = window.setTimeout(() => {
    showDropdown.value = false;
  }, 500);
};

// 清除关闭定时器
const clearCloseTimer = () => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

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

// 退出登录
const handleLogout = () => {
  // 使用 tokenManager 清除所有 token
  tokenManager.clearTokens();
  router.push("/login");
};
</script>

<style scoped>
.common-layout .el-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 激活项背景色 */
:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border-radius: 8px;
  margin: 4px 8px;
  color: #fff !important;
}

/* 激活项文字颜色 */
:deep(.el-menu-item.is-active) span {
  color: #fff !important;
}

/* 激活项图标颜色 */
:deep(.el-menu-item.is-active) .el-icon {
  color: #fff !important;
}

/* 悬停效果 */
:deep(.el-menu-item:hover) {
  background: linear-gradient(135deg, #a8b4f5 0%, #b8a5d9 100%) !important;
  border-radius: 8px;
  margin: 4px 8px;
  color: #fff !important;
}

:deep(.el-menu-item:hover) span {
  color: #fff !important;
}

:deep(.el-menu-item:hover) .el-icon {
  color: #fff !important;
}

/* 子菜单样式 */
:deep(.el-sub-menu .el-menu-item) {
  padding-left: 50px !important;
}

:deep(.el-sub-menu .el-menu-item .el-icon) {
  margin-right: 8px;
}

.common-layout .el-menu {
  border-right: none;
}

.common-layout .el-aside {
  border-right: 1px solid #e2e8f0;
  position: relative;
}

.common-layout .el-main {
  padding: 0;
}

.breadcrumb-container {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 0 20px;
  height: 50px;
  display: flex;
  align-items: center;
}

.main-content {
  padding: 10px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  min-height: calc(100vh - 120px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.common-layout .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.user-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #fff;
}

.user-wrapper:hover {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 120px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  margin-top: 8px;
  z-index: 2000;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  transition: all 0.3s ease;
  color: #475569;
}

.menu-item:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.menu-item .el-icon {
  margin-right: 8px;
  font-size: 14px;
}

.collapse-trigger {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #afb8f0 0%, #e1ccf8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 1000;
}

.collapse-trigger:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.collapse-trigger .el-icon {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  transition: transform 0.3s ease;
}

.collapse-trigger .el-icon.is-collapsed {
  transform: rotate(180deg);
}
</style>
