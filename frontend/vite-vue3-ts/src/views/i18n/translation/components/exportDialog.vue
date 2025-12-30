<template>
  <el-dialog
    v-model="visible"
    title="选择导出类型"
    width="35%"
    :close-on-click-modal="false"
  >
    <div class="export-container">
      <el-radio-group v-model="selectedLang">
        <div class="radio-item">
          <el-radio value="all">全部</el-radio>
        </div>
        <div class="radio-item">
          <el-radio value="zh-CN">翻译项</el-radio>
        </div>
        <div class="radio-item">
          <el-radio value="en-US">翻译项-英文</el-radio>
        </div>
        <div class="radio-item">
          <el-radio value="zh-HK">翻译项-繁体中文</el-radio>
        </div>
      </el-radio-group>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleExport" :disabled="!selectedLang || isExporting" :loading="isExporting">
        导出
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(["update:modelValue"]);
const visible = ref(props.modelValue);
// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);
// 必须把弹窗的状态也同步给父组件，要不然下次打开的时候会有问题
watch(visible, (val) => emit("update:modelValue", val));

const selectedLang = ref("all"); // 绑定单选值，默认为"全部"
const isExporting = ref(false); // 导出状态

const BASE_URL = import.meta.env.VITE_APP_API_BASE;
const handleExport = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.error("请先登录");
    return;
  }

  isExporting.value = true; // 开始导出
  try {
    if (selectedLang.value === "all") {
      // 批量导出所有语言版本
      const languages = [
        { value: "zh-CN", name: "翻译项" },
        { value: "en-US", name: "翻译项-英文" },
        { value: "zh-HK", name: "翻译项-繁体中文" }
      ];

      ElMessage.info("开始批量导出，请稍候...");
      
      // 依次下载每个文件
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        await downloadSingleFile(lang.value, lang.name, token);
        
        // 添加延迟，避免浏览器阻止多个下载
        if (i < languages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      ElMessage.success("所有JSON文件导出成功");
    } else {
      // 单个文件导出
      const langNames: Record<string, string> = {
        "zh-CN": "翻译项",
        "en-US": "翻译项-英文", 
        "zh-HK": "翻译项-繁体中文"
      };
      
      const langName = langNames[selectedLang.value] || selectedLang.value;
      await downloadSingleFile(selectedLang.value, langName, token);
      ElMessage.success(`${langName}.json文件导出成功`);
    }
    
    visible.value = false;
    selectedLang.value = "all"; // 重置选择为"全部"
  } catch (error) {
    ElMessage.error("导出JSON文件失败");
  } finally {
    isExporting.value = false; // 结束导出
  }
};

// 下载单个文件的辅助函数
const downloadSingleFile = async (langType: string, langName: string, token: string) => {
  const response = await fetch(`${BASE_URL}/api/exportBing?langType=${langType}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`导出${langName}失败`);
  }

  const blob = await response.blob();
  
  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `${langType}.json`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
</script>

<style scoped>
.export-container {
  margin: 0 0 10px 0;
}

.radio-item {
  padding: 12px 0;
  margin-right: 20px;
}

.radio-item:last-child {
  border-bottom: none;
}

:deep(.el-radio__label) {
  font-size: 14px;
}
</style>
