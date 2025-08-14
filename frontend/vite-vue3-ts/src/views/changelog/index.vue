<template>
  <div class="container">
    <div class="changelog-content">
      <el-timeline>
        <el-timeline-item
          v-for="version in versions"
          :key="version.version"
          :timestamp="version.date"
          placement="top"
          :type="getTimelineType(version.type)"
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

              <div
                v-if="version.features && version.features.length > 0"
                class="change-section"
              >
                <h4>✨ 新功能</h4>
                <ul>
                  <li v-for="feature in version.features" :key="feature">
                    {{ feature }}
                  </li>
                </ul>
              </div>

              <div
                v-if="version.improvements && version.improvements.length > 0"
                class="change-section"
              >
                <h4>🔧 改进</h4>
                <ul>
                  <li
                    v-for="improvement in version.improvements"
                    :key="improvement"
                  >
                    {{ improvement }}
                  </li>
                </ul>
              </div>

              <div
                v-if="version.fixes && version.fixes.length > 0"
                class="change-section"
              >
                <h4>🐛 修复</h4>
                <ul>
                  <li v-for="fix in version.fixes" :key="fix">{{ fix }}</li>
                </ul>
              </div>

              <div
                v-if="version.breaking && version.breaking.length > 0"
                class="change-section"
              >
                <h4>⚠️ 破坏性变更</h4>
                <ul>
                  <li v-for="breaking in version.breaking" :key="breaking">
                    {{ breaking }}
                  </li>
                </ul>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 版本数据
const versions = ref([
  {
    version: "1.0.0",
    date: "2025-08-13",
    type: "major",
    description: "初始版本发布",
    features: ["基础页面框架", "MongoDB 数据库集成", "Express.js 后端 API"],
    improvements: [],
    fixes: [],
    breaking: [],
  },
]);

// 获取标签类型
const getTagType = (type: string) => {
  switch (type) {
    case "major":
      return "danger";
    case "minor":
      return "warning";
    case "patch":
      return "info";
    default:
      return "info";
  }
};

// 获取时间线类型
const getTimelineType = (type: string) => {
  switch (type) {
    case "major":
      return "danger";
    case "minor":
      return "warning";
    case "patch":
      return "info";
    default:
      return "primary";
  }
};

// 获取类型文本
const getTypeText = (type: string) => {
  switch (type) {
    case "major":
      return "重大更新";
    case "minor":
      return "功能更新";
    case "patch":
      return "Bug 修复";
    default:
      return "更新";
  }
};
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
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
