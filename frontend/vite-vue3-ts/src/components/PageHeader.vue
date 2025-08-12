<template>
  <div class="page-header">
    <div class="header-left">
      <h2 class="page-title">{{ title }}</h2>
    </div>
    <div class="header-right">
      <slot name="actions">
        <!-- 默认操作按钮 -->
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Download } from '@element-plus/icons-vue'

interface Props {
  title: string
}

defineProps<Props>()

const emit = defineEmits<{
  refresh: []
  export: []
}>()

const handleRefresh = () => {
  emit('refresh')
}

const handleExport = () => {
  emit('export')
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
