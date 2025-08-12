<template>
  <div class="home-container">
    <!-- 页面头部 -->
    <PageHeader title="首页" />
    
    <!-- 搜索过滤器 -->
    <SearchFilter 
      @search="handleSearch"
      @reset="handleReset"
    />
    
    <!-- 主要内容区域 -->
    <div class="content-area">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">1,234</div>
              <div class="stat-label">总翻译项</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">567</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">89%</div>
              <div class="stat-label">完成率</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-card class="welcome-card">
        <h2>欢迎使用国际化平台</h2>
        <p>这是一个基于 Vue 3 + TypeScript + Express + MongoDB 的全栈项目</p>
        <ul>
          <li>在这个项目中可以随意的使用最新的技术</li>
          <li>在这个项目中我希望能做一些技术的积累和分享</li>
          <li>在这个项目中我希望能集成一些前端的实用工具，用于提高开发效率</li>
        </ul>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const PageHeader = defineAsyncComponent(() => import('../components/PageHeader.vue'))
const SearchFilter = defineAsyncComponent(() => import('../components/SearchFilter.vue'))

const handleSearch = (data: any) => {
  console.log('搜索数据:', data)
}

const handleReset = () => {
  console.log('重置搜索')
}
</script>

<style scoped>
.home-container {
  min-height: 100%;
}

.content-area {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  margin-bottom: 20px;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.welcome-card {
  margin-top: 20px;
}

.welcome-card h2 {
  color: #303133;
  margin-bottom: 16px;
}

.welcome-card p {
  color: #606266;
  margin-bottom: 16px;
}

.welcome-card ul {
  color: #606266;
  line-height: 1.8;
}

.welcome-card li {
  margin-bottom: 8px;
}
</style>
