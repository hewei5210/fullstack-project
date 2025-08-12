<template>
  <div class="changelog">
    <el-card class="changelog-card">
      <template #header>
        <div class="card-header">
          <span>更新日志</span>
        </div>
      </template>
      
      <div class="changelog-content">
        <el-timeline>
          <el-timeline-item
            v-for="version in versions"
            :key="version.version"
            :timestamp="version.date"
            placement="top"
            :type="version.type"
          >
            <el-card class="version-card">
              <template #header>
                <div class="version-header">
                  <span class="version-title">v{{ version.version }}</span>
                  <el-tag :type="getTagType(version.type)" size="small">
                    {{ getTypeText(version.type) }}
                  </el-tag>
                </div>
              </template>
              
              <div class="version-content">
                <div v-if="version.description" class="version-description">
                  {{ version.description }}
                </div>
                
                <div v-if="version.features && version.features.length > 0" class="change-section">
                  <h4>✨ 新功能</h4>
                  <ul>
                    <li v-for="feature in version.features" :key="feature">{{ feature }}</li>
                  </ul>
                </div>
                
                <div v-if="version.improvements && version.improvements.length > 0" class="change-section">
                  <h4>🔧 改进</h4>
                  <ul>
                    <li v-for="improvement in version.improvements" :key="improvement">{{ improvement }}</li>
                  </ul>
                </div>
                
                <div v-if="version.fixes && version.fixes.length > 0" class="change-section">
                  <h4>🐛 修复</h4>
                  <ul>
                    <li v-for="fix in version.fixes" :key="fix">{{ fix }}</li>
                  </ul>
                </div>
                
                <div v-if="version.breaking && version.breaking.length > 0" class="change-section">
                  <h4>⚠️ 破坏性变更</h4>
                  <ul>
                    <li v-for="breaking in version.breaking" :key="breaking">{{ breaking }}</li>
                  </ul>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 版本数据
const versions = ref([
  {
    version: '2.0.0',
    date: '2024-08-12',
    type: 'major',
    description: '重大版本更新，重构了整个系统架构，新增多级菜单和国际化管理功能',
    features: [
      '新增项目国际化管理模块',
      '新增国际化介绍、脚本、插件页面',
      '新增用户管理功能',
      '新增更新日志页面',
      '重构菜单结构，支持多级菜单',
      '优化页面布局和用户体验'
    ],
    improvements: [
      '优化了数据库结构设计',
      '改进了前端路由配置',
      '增强了错误处理机制',
      '提升了系统性能'
    ],
    fixes: [
      '修复了菜单显示问题',
      '修复了路由跳转异常',
      '修复了数据同步问题'
    ],
    breaking: [
      '菜单结构发生重大变化',
      '部分 API 接口路径调整',
      '数据库字段结构优化'
    ]
  },
  {
    version: '1.5.0',
    date: '2024-07-15',
    type: 'minor',
    description: '功能增强版本，新增批量操作和导出功能',
    features: [
      '新增批量导入翻译功能',
      '新增 Excel 导出功能',
      '新增翻译模板下载',
      '新增搜索和筛选功能'
    ],
    improvements: [
      '优化了翻译项管理界面',
      '改进了数据验证逻辑',
      '增强了用户权限控制'
    ],
    fixes: [
      '修复了分页显示问题',
      '修复了数据更新延迟问题'
    ]
  },
  {
    version: '1.4.2',
    date: '2024-06-20',
    type: 'patch',
    description: 'Bug 修复版本',
    fixes: [
      '修复了登录状态丢失问题',
      '修复了数据保存失败问题',
      '修复了界面显示异常'
    ]
  },
  {
    version: '1.4.0',
    date: '2024-05-10',
    type: 'minor',
    description: '新增翻译项管理功能',
    features: [
      '新增翻译项 CRUD 操作',
      '新增翻译项列表展示',
      '新增翻译项编辑功能',
      '新增翻译项删除功能'
    ],
    improvements: [
      '优化了数据库连接配置',
      '改进了前端组件结构'
    ]
  },
  {
    version: '1.0.0',
    date: '2024-04-01',
    type: 'major',
    description: '初始版本发布',
    features: [
      '基础用户认证系统',
      '基础页面框架',
      'MongoDB 数据库集成',
      'Express.js 后端 API'
    ]
  }
])

// 获取标签类型
const getTagType = (type: string) => {
  switch (type) {
    case 'major':
      return 'danger'
    case 'minor':
      return 'warning'
    case 'patch':
      return 'info'
    default:
      return 'info'
  }
}

// 获取类型文本
const getTypeText = (type: string) => {
  switch (type) {
    case 'major':
      return '重大更新'
    case 'minor':
      return '功能更新'
    case 'patch':
      return 'Bug 修复'
    default:
      return '更新'
  }
}
</script>

<style scoped>
.changelog {
  padding: 20px;
}

.changelog-card {
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.changelog-content {
  padding: 20px 0;
}

.version-card {
  margin-bottom: 10px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-title {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.version-content {
  line-height: 1.6;
}

.version-description {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #606266;
}

.change-section {
  margin-bottom: 16px;
}

.change-section h4 {
  color: #409eff;
  margin-bottom: 8px;
  font-size: 14px;
}

.change-section ul {
  margin: 0;
  padding-left: 20px;
}

.change-section li {
  margin-bottom: 4px;
  color: #606266;
}

.el-timeline-item {
  padding-bottom: 20px;
}

.el-timeline-item:last-child {
  padding-bottom: 0;
}
</style>
