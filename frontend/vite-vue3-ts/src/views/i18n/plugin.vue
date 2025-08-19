<template>
  <div class="container">
    <div class="plugins-grid">
      <!-- Vue-i18n 悬浮展示插件 -->
      <div class="plugin-card">
        <div class="plugin-header">
          <div class="plugin-icon">
            <img src="/logo.png" alt="Vue-i18n Hover Plugin" class="logo" />
          </div>
          <div class="plugin-info">
            <h3 class="plugin-name">vue-i18n-hover</h3>
            <p class="plugin-description">
              这是一个vue-i18n代码悬浮展示中文的扩展。
            </p>
            <div class="plugin-tags">
              <el-tag size="small" type="success">Vue.js</el-tag>
              <el-tag size="small" type="warning">VS Code</el-tag>
              <el-tag size="small" type="danger">内部使用</el-tag>
            </div>
          </div>
        </div>

        <div class="plugin-content">
          <div class="section">
            <h4 class="section-title">
              <el-icon><Download /></el-icon>
              安装
            </h4>
            <p>在 VS Code 中搜索并安装 <code>"vue-i18n-hover"</code></p>
            <div class="install-steps">
              <div class="step">1. 打开 VS Code</div>
              <div class="step">2. 按 <kbd>Ctrl+Shift+X</kbd> 打开扩展</div>
              <div class="step">3. 搜索 "vue-i18n-hover"</div>
              <div class="step">4. 点击安装</div>
            </div>
          </div>

          <div class="section">
            <h4 class="section-title">
              <el-icon><VideoPlay /></el-icon>
              使用
            </h4>
            <div class="usage-steps">
              <div class="step">1. 打开命令面板（<kbd>Ctrl+Shift+P</kbd>）</div>
              <div class="step">2. 输入并选择 <code>vue-i18n-hover</code></div>
            </div>
          </div>

          <div class="section">
            <h4 class="section-title">
              <el-icon><Star /></el-icon>
              功能特性
            </h4>
            <div class="features-list">
              <div class="feature-item">
                <el-icon><View /></el-icon>
                <span>悬浮展示中文翻译</span>
              </div>
              <div class="feature-item">
                <el-icon><Document /></el-icon>
                <span>智能识别 i18n 键值</span>
              </div>
              <div class="feature-item">
                <el-icon><Refresh /></el-icon>
                <span>实时更新翻译</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预留其他插件位置 -->
      <div class="plugin-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">
            <el-icon><Plus /></el-icon>
          </div>
          <h3>更多插件</h3>
          <p>我们正在开发更多实用的国际化插件</p>
          <div class="coming-soon">
            <span>敬请期待</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Download,
  VideoPlay,
  Star,
  View,
  Document,
  Refresh,
  Plus
} from "@element-plus/icons-vue";
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  align-items: start;
}

.plugin-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.plugin-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.plugin-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.plugin-icon {
  margin-right: 16px;
}

.logo {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: white;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.plugin-info {
  flex: 1;
}

.plugin-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
}

.plugin-description {
  font-size: 14px;
  margin: 0 0 12px 0;
  opacity: 0.9;
  line-height: 1.4;
}

.plugin-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.plugin-tags .el-tag {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 11px;
}

.plugin-content {
  padding: 20px;
}

.section {
  margin-bottom: 20px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f2f5;
}

.section-title .el-icon {
  font-size: 16px;
  color: #409eff;
}

.section p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.section code {
  background: #f5f7fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  color: #e6a23c;
  font-size: 12px;
}

.install-steps,
.usage-steps {
  margin-top: 12px;
}

.step {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.feature-item .el-icon {
  color: #409eff;
  font-size: 14px;
}

.plugin-placeholder {
  border: 2px dashed #e4e7ed;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.plugin-placeholder::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(64, 158, 255, 0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.plugin-placeholder:hover {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.1);
}

.placeholder-content {
  text-align: center;
  color: #606266;
  position: relative;
  z-index: 1;
}

.placeholder-icon {
  margin-bottom: 16px;
}

.placeholder-icon .el-icon {
  font-size: 48px;
  color: #409eff;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.plugin-placeholder:hover .placeholder-icon .el-icon {
  opacity: 1;
  transform: scale(1.1);
}

.placeholder-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.placeholder-content p {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.coming-soon {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 20px;
  color: #409eff;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.plugin-placeholder:hover .coming-soon {
  background: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.3);
  transform: scale(1.05);
}

kbd {
  background: #f5f7fa;
  border: 1px solid #d3d4d6;
  border-radius: 3px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  color: #333;
  display: inline-block;
  font-size: 10px;
  line-height: 1.4;
  margin: 0 0.1em;
  padding: 0.1em 0.4em;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plugins-grid {
    grid-template-columns: 1fr;
  }
  
  .plugin-header {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .plugin-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>
