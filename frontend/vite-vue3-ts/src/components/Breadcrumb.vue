<template>
  <el-breadcrumb class="app-breadcrumb" separator=">">
    <el-breadcrumb-item v-for="(item, index) in levelList" :key="index">
      <span class="no-redirect">
        {{ item.meta?.title || item.name }}
      </span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { RouteLocationMatched } from "vue-router";

const route = useRoute();

const levelList = ref<RouteLocationMatched[]>([]);

// 生成面包屑数据
const getBreadcrumb = () => {
  let matched = route.matched.filter((item) => item.meta && item.meta.title);

  // 只保留侧边栏的一级和二级菜单
  matched = matched.filter((item) => {
    const path = item.path;

    // 排除控制台根路径
    if (path === "/console") {
      return false;
    }

    // 只保留一级菜单和二级菜单
    const pathSegments = path.split("/").filter((segment) => segment);

    // 如果是 /console/xxx 格式，只保留 xxx 部分
    if (pathSegments[0] === "console") {
      // 一级菜单：/console/home, /console/user, /console/changelog
      if (pathSegments.length === 2) {
        return true;
      }
      // 二级菜单：/console/i18n/xxx
      if (pathSegments.length === 3 && pathSegments[1] === "i18n") {
        return true;
      }
    }

    return false;
  });

  levelList.value = matched.filter(
    (item) => item.meta && item.meta.title && item.meta.breadcrumb !== false
  );
};

// 监听路由变化
watch(
  () => route.path,
  () => getBreadcrumb(),
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;

  :deep(.el-breadcrumb__separator) {
    color: #64748b;
  }

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: #64748b;
      font-weight: 500;
    }
  }

  .no-redirect {
    color: #475569;
    cursor: text;
    font-weight: 600;
  }
}
</style>
