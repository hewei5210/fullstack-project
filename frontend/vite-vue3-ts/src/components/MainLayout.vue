<template>
  <el-container class="common-layout" style="height: 100vh">
    <el-header style="text-align: right; font-size: 12px">
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
    </el-header>
    <el-container>
      <el-aside width="250px" style="background: #f5f5f5">
        <el-menu
          router
          :default-active="$route.path"
          background-color="#f5f5f5"
          text-color="#303030"
          :popper-append-to-body="false"
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
          <router-view />
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
const username = localStorage.getItem("username");

import { ref, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";
import { 
  SwitchButton, 
  House, 
  Document, 
  Tools, 
  Connection, 
  List, 
  User, 
  Clock 
} from "@element-plus/icons-vue";

const Breadcrumb = defineAsyncComponent(() => import("./Breadcrumb.vue"));

const router = useRouter();
const showDropdown = ref(false);
let closeTimer: number | null = null;

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

// 退出登录
const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  router.push("/login");
};
</script>

<style scoped>
.common-layout .el-header {
  position: relative;
  background-color: #fff;
  color: #303030;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 激活项背景色 */
:deep(.el-menu-item.is-active) {
  background-color: #e8e8e8 !important;
  border-radius: 4px;
}

/* 激活项文字颜色 */
/* :deep(.el-menu-item.is-active) span {
    color: #303030 !important;
  } */

/* 激活项图标颜色 */
:deep(.el-menu-item.is-active) .el-icon {
  color: #303030 !important;
}

/* 悬停效果 */
:deep(.el-menu-item:hover) {
  background-color: #f0f0f0 !important;
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
  border-right: 1px solid #e4e7ed;
}

.common-layout .el-main {
  padding: 0;
}

.breadcrumb-container {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 50px;
  display: flex;
  align-items: center;
}

.main-content {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.common-layout .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}

.user-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-wrapper:hover {
  background-color: #f0f0f0;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 100px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  z-index: 2000;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  transition: background-color 0.3s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item .el-icon {
  margin-right: 8px;
  font-size: 14px;
}
</style>
