<template>
  <div class="container">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="文本提取脚本" name="extract">
        <div class="script-section">
          <div class="code-editor">
            <div class="editor-header">
              <span class="language-tag">javascript</span>
              <div class="editor-actions">
                <el-button
                  type="text"
                  @click="downloadScript('extract')"
                  class="action-btn"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button
                  type="text"
                  @click="copyScript('extract')"
                  :loading="copying"
                  class="action-btn"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
                <el-button
                  type="text"
                  @click="toggleFullscreen('extract')"
                  class="action-btn"
                >
                  <el-icon><FullScreen /></el-icon>
                </el-button>
              </div>
            </div>
            <div
              class="code-content"
              :class="{ fullscreen: fullscreenMode === 'extract' }"
            >
              <div
                v-if="fullscreenMode === 'extract'"
                class="fullscreen-overlay"
                @click="exitFullscreen"
              >
                <div class="fullscreen-content" @click.stop>
                  <div class="fullscreen-header">
                    <span>翻译项提取脚本</span>
                    <el-button
                      type="text"
                      @click="exitFullscreen"
                      class="close-btn"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  <pre><code class="language-javascript">{{ extractScript }}</code></pre>
                </div>
              </div>
              <pre
                v-else
              ><code class="language-javascript">{{ extractScript }}</code></pre>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Excel文件去重" name="set">
        <div class="script-section">
          <div class="code-editor">
            <div class="editor-header">
              <span class="language-tag">javascript</span>
              <div class="editor-actions">
                <el-button
                  type="text"
                  @click="downloadScript('set')"
                  class="action-btn"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button
                  type="text"
                  @click="copyScript('set')"
                  :loading="copying"
                  class="action-btn"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
                <el-button
                  type="text"
                  @click="toggleFullscreen('set')"
                  class="action-btn"
                >
                  <el-icon><FullScreen /></el-icon>
                </el-button>
              </div>
            </div>
            <div
              class="code-content"
              :class="{ fullscreen: fullscreenMode === 'set' }"
            >
              <div
                v-if="fullscreenMode === 'set'"
                class="fullscreen-overlay"
                @click="exitFullscreen"
              >
                <div class="fullscreen-content" @click.stop>
                  <div class="fullscreen-header">
                    <span>Excel文件去重脚本</span>
                    <el-button
                      type="text"
                      @click="exitFullscreen"
                      class="close-btn"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  <pre><code class="language-javascript">{{ setScript }}</code></pre>
                </div>
              </div>
              <pre
                v-else
              ><code class="language-javascript">{{ setScript }}</code></pre>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  CopyDocument,
  Download,
  FullScreen,
  Close,
} from "@element-plus/icons-vue";

// 导入脚本内容
import extractScriptContent from "./js/extractScript.js?raw";
import setScriptContent from "./js/set.js?raw";



const activeTab = ref("extract");
const copying = ref(false);
const fullscreenMode = ref<string | null>(null);

// 脚本内容
const extractScript = ref("");
const setScript = ref("");

// 加载脚本内容
const loadScripts = () => {
  try {
    extractScript.value = extractScriptContent;
    setScript.value = setScriptContent;
    

    
    // 应用语法高亮
    nextTick(() => {
      applySyntaxHighlighting();
    });
  } catch (error) {
    console.error("加载脚本失败:", error);
    ElMessage.error("加载脚本失败");
  }
};

// 应用语法高亮
const applySyntaxHighlighting = () => {
  // 暂时禁用语法高亮，确保显示原始内容
  // 这样可以保证extractScript.js文件的内容完整显示
};

// 复制脚本
const copyScript = async (type: string) => {
  copying.value = true;
  try {
    let scriptContent = "";
    switch (type) {
      case "extract":
        scriptContent = extractScript.value;
        break;
      case "set":
        scriptContent = setScript.value;
        break;
    }

    await navigator.clipboard.writeText(scriptContent);
    ElMessage.success("脚本已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败");
  } finally {
    copying.value = false;
  }
};

// 下载脚本
const downloadScript = (type: string) => {
  let scriptContent = "";
  let fileName = "";

  switch (type) {
    case "extract":
      scriptContent = extractScript.value;
      fileName = "extractScript.js";
      break;
    case "set":
      scriptContent = setScript.value;
      fileName = "set.js";
      break;
  }

  const blob = new Blob([scriptContent], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  ElMessage.success("脚本下载成功");
};

// 切换全屏模式
const toggleFullscreen = (type: string) => {
  if (fullscreenMode.value === type) {
    fullscreenMode.value = null;
  } else {
    fullscreenMode.value = type;
  }
};

// 退出全屏模式
const exitFullscreen = () => {
  fullscreenMode.value = null;
};

// 监听ESC键退出全屏
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && fullscreenMode.value) {
    exitFullscreen();
  }
};

// 组件挂载时加载脚本
onMounted(() => {
  loadScripts();
  // 添加键盘事件监听
  document.addEventListener("keydown", handleKeydown);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
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

.script-section h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.code-editor {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.language-tag {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.editor-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px;
  color: #606266;
  border: none;
  background: transparent;
  border-radius: 4px;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #ecf5ff;
  color: #409eff;
}

.action-btn .el-icon {
  font-size: 16px;
}

.code-content {
  position: relative;
  max-height: 600px;
  overflow: auto;
  transition: all 0.3s ease;
}

/* 全屏模式样式 */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.fullscreen-content {
  background: #fff;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  padding: 6px;
  color: #606266;
  border: none;
  background: transparent;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #ecf5ff;
  color: #409eff;
}

.fullscreen-content pre {
  margin: 0;
  padding: 20px;
  background: #f8f9fa;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "Liberation Mono",
    monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  flex: 1;
  max-height: calc(90vh - 80px);
}

.code-content pre {
  margin: 0;
  padding: 20px;
  background: #f8f9fa;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "Liberation Mono",
    monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-content code {
  font-family: inherit;
  background: transparent;
  padding: 0;
  border-radius: 0;
  color: inherit;
}

/* 代码显示样式 */
.code-content code.language-javascript {
  color: #333;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "Liberation Mono", monospace;
}

/* 滚动条样式 */
.code-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.code-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.code-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.code-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .editor-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .code-content pre {
    padding: 16px;
    font-size: 13px;
  }
}
</style>
