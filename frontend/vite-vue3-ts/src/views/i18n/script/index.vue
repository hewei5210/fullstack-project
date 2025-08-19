<template>
  <div class="container">
    <h2>自动化脚本工具</h2>
    <p>提供各种自动化脚本来简化国际化工作流程，提高开发效率。</p>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="文本提取脚本" name="extract">
        <div class="script-section">
          <h3>Vue.js 文本提取脚本</h3>
          <div class="script-header">
            <el-button type="primary" @click="copyScript('extract')" :loading="copying">
              <el-icon><CopyDocument /></el-icon>
              复制脚本
            </el-button>
          </div>
          <el-card class="code-card">
            <pre><code>{{ extractScript }}</code></pre>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="资源生成脚本" name="generate">
        <div class="script-section">
          <h3>多语言资源生成脚本</h3>
          <div class="script-header">
            <el-button type="primary" @click="copyScript('generate')" :loading="copying">
              <el-icon><CopyDocument /></el-icon>
              复制脚本
            </el-button>
          </div>
          <el-card class="code-card">
            <pre><code>{{ generateScript }}</code></pre>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量处理脚本" name="batch">
        <div class="script-section">
          <h3>批量翻译处理脚本</h3>
          <div class="script-header">
            <el-button type="primary" @click="copyScript('batch')" :loading="copying">
              <el-icon><CopyDocument /></el-icon>
              复制脚本
            </el-button>
          </div>
          <el-card class="code-card">
            <pre><code>{{ batchScript }}</code></pre>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { CopyDocument } from "@element-plus/icons-vue";

// 导入脚本内容
import extractScriptContent from './extractScript.js?raw';
import generateScriptContent from './generateScript.js?raw';
import batchScriptContent from './batchScript.js?raw';

const activeTab = ref("extract");
const copying = ref(false);

// 脚本内容
const extractScript = ref("");
const generateScript = ref("");
const batchScript = ref("");

// 加载脚本内容
const loadScripts = () => {
  try {
    extractScript.value = extractScriptContent;
    generateScript.value = generateScriptContent;
    batchScript.value = batchScriptContent;
  } catch (error) {
    console.error('加载脚本失败:', error);
    ElMessage.error('加载脚本失败');
  }
};

// 复制脚本
const copyScript = async (type: string) => {
  copying.value = true;
  try {
    let scriptContent = "";
    switch (type) {
      case 'extract':
        scriptContent = extractScript.value;
        break;
      case 'generate':
        scriptContent = generateScript.value;
        break;
      case 'batch':
        scriptContent = batchScript.value;
        break;
    }

    await navigator.clipboard.writeText(scriptContent);
    ElMessage.success('脚本已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败');
  } finally {
    copying.value = false;
  }
};

// 组件挂载时加载脚本
onMounted(() => {
  loadScripts();
});
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.script-section {
  margin-bottom: 30px;
}

.script-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.code-card {
  margin: 16px 0;
  background-color: #f5f7fa;
}

.code-card pre {
  margin: 0;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-card code {
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}
</style>
