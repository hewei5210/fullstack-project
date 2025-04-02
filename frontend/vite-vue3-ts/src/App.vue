<template>
  <el-container class="layout-container-demo" style="height: 100vh">
    <el-aside width="200px" style="background: #f5f5f5">
      <el-menu
        router
        :default-active="$route.path"
        background-color="#f5f5f5"
        text-color="#303030"
        :popper-append-to-body="false"
      >
        <el-menu-item index="/">
          <el-icon><house /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/id">
          <el-icon><house /></el-icon>
          <span>获取ID</span>
        </el-menu-item>
        <el-menu-item index="/about">
          <el-icon><info-filled /></el-icon>
          <span>关于我们</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="text-align: right; font-size: 12px">
        <div class="toolbar">
          <el-dropdown>
            <el-icon style="margin-right: 8px; margin-top: 1px">
              <setting />
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>View</el-dropdown-item>
                <el-dropdown-item>Add</el-dropdown-item>
                <el-dropdown-item>Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span>Tom</span>
        </div>
      </el-header>

      <el-main>
        <router-view /> 
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container-demo .el-header {
  position: relative;
  background-color: #f5f5f5;
  color: #303030;
}

/* 激活项背景色 */
:deep(.el-menu-item.is-active) {
  background-color: #e8e8e8 !important;
  border-radius: 4px;
}

/* 激活项文字颜色 */
:deep(.el-menu-item.is-active) span {
  color: #303030 !important;
}

/* 激活项图标颜色 */
:deep(.el-menu-item.is-active) .el-icon {
  color: #303030 !important;
}

/* 悬停效果 */
:deep(.el-menu-item:hover) {
  background-color: #f0f0f0 !important;
}
.layout-container-demo .el-menu {
  border-right: none;
}
.layout-container-demo .el-main {
  padding: 0;
}
.layout-container-demo .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}
</style>
