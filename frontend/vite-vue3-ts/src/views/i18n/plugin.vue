<template>
  <div class="container">
    <h2>开发框架插件</h2>
    <p>为各种主流开发框架提供国际化插件，简化集成过程。</p>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="plugin-item">
              <template #header>
                <div class="plugin-header">
                  <el-icon><VueIcon /></el-icon>
                  <span>Vue.js 插件</span>
                </div>
              </template>

              <div class="plugin-info">
                <h4>vue-i18n-helper</h4>
                <p>
                  Vue.js
                  国际化助手插件，支持自动提取文本、热重载、类型检查等功能。
                </p>

                <div class="plugin-features">
                  <el-tag size="small" type="success">自动提取</el-tag>
                  <el-tag size="small" type="warning">热重载</el-tag>
                  <el-tag size="small" type="info">类型检查</el-tag>
                </div>

                <div class="plugin-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="installPlugin('vue')"
                  >
                    安装插件
                  </el-button>
                  <el-button size="small" @click="viewDocs('vue')">
                    查看文档
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="plugin-item">
              <template #header>
                <div class="plugin-header">
                  <el-icon><ReactIcon /></el-icon>
                  <span>React 插件</span>
                </div>
              </template>

              <div class="plugin-info">
                <h4>react-i18n-toolkit</h4>
                <p>
                  React 国际化工具包，提供 Hook、组件、工具函数等完整解决方案。
                </p>

                <div class="plugin-features">
                  <el-tag size="small" type="success">Hook 支持</el-tag>
                  <el-tag size="small" type="warning">组件封装</el-tag>
                  <el-tag size="small" type="info">工具函数</el-tag>
                </div>

                <div class="plugin-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="installPlugin('react')"
                  >
                    安装插件
                  </el-button>
                  <el-button size="small" @click="viewDocs('react')">
                    查看文档
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card class="plugin-item">
              <template #header>
                <div class="plugin-header">
                  <el-icon><AngularIcon /></el-icon>
                  <span>Angular 插件</span>
                </div>
              </template>

              <div class="plugin-info">
                <h4>angular-i18n-extension</h4>
                <p>
                  Angular 国际化扩展，集成 Angular 内置 i18n
                  功能，提供增强工具。
                </p>

                <div class="plugin-features">
                  <el-tag size="small" type="success">内置集成</el-tag>
                  <el-tag size="small" type="warning">增强工具</el-tag>
                  <el-tag size="small" type="info">CLI 支持</el-tag>
                </div>

                <div class="plugin-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="installPlugin('angular')"
                  >
                    安装插件
                  </el-button>
                  <el-button size="small" @click="viewDocs('angular')">
                    查看文档
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="plugin-item">
              <template #header>
                <div class="plugin-header">
                  <el-icon><NodeIcon /></el-icon>
                  <span>Node.js 插件</span>
                </div>
              </template>

              <div class="plugin-info">
                <h4>node-i18n-middleware</h4>
                <p>Node.js 国际化中间件，支持服务端渲染、API 国际化等功能。</p>

                <div class="plugin-features">
                  <el-tag size="small" type="success">中间件</el-tag>
                  <el-tag size="small" type="warning">SSR 支持</el-tag>
                  <el-tag size="small" type="info">API 国际化</el-tag>
                </div>

                <div class="plugin-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="installPlugin('node')"
                  >
                    安装插件
                  </el-button>
                  <el-button size="small" @click="viewDocs('node')">
                    查看文档
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <div class="plugin-usage">
          <h3>使用示例</h3>
          <el-tabs v-model="activeExample" type="border-card">
            <el-tab-pane label="Vue.js" name="vue">
              <pre><code>// main.js
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import i18nHelper from 'vue-i18n-helper'

const app = createApp(App)
const i18n = createI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

app.use(i18n)
app.use(i18nHelper)
app.mount('#app')</code></pre>
            </el-tab-pane>

            <el-tab-pane label="React" name="react">
              <pre><code>// App.jsx
import { I18nProvider } from 'react-i18n-toolkit'
import { useTranslation } from 'react-i18n-toolkit'

function App() {
  return (
    &lt;I18nProvider locale="zh-CN"&gt;
      &lt;MyComponent /&gt;
    &lt;/I18nProvider&gt;
  )
}

function MyComponent() {
  const { t } = useTranslation()
  return &lt;div&gt;{t('hello.world')}&lt;/div&gt;
}</code></pre>
            </el-tab-pane>
          </el-tabs>
        </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";

const activeExample = ref("vue");

const installPlugin = (framework: string) => {
  console.log(`安装 ${framework} 插件`);
  ElMessage.success(`${framework} 插件安装功能开发中...`);
};

const viewDocs = (framework: string) => {
  console.log(`查看 ${framework} 文档`);
  ElMessage.info(`${framework} 文档查看功能开发中...`);
};
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.plugin-item {
  margin-bottom: 20px;
  height: 100%;
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plugin-info h4 {
  color: #409eff;
  margin-bottom: 12px;
}

.plugin-features {
  margin: 16px 0;
}

.plugin-features .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.plugin-actions {
  margin-top: 16px;
}

.plugin-actions .el-button {
  margin-right: 12px;
}

.plugin-usage {
  margin-top: 40px;
}

.plugin-usage h3 {
  color: #606266;
  margin-bottom: 20px;
}

.plugin-usage pre {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}

.plugin-usage code {
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.4;
}
</style>
