<template>
  <el-dialog
    v-model="visible"
    title="选择导出类型"
    width="30%"
    :close-on-click-modal="false"
  >
    <div class="export-container">
      <el-radio-group v-model="selectedLang">
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
      <el-button type="primary" @click="handleExport" :disabled="!selectedLang">
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

const selectedLang = ref("zh-CN"); // 绑定单选值

const BASE_URL = import.meta.env.VITE_APP_API_BASE;
const handleExport = () => {
  if (!selectedLang.value) {
    ElMessage.warning("请先选择导出类型");
    return;
  }

  // 使用 fetch 方式下载文件
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.error("请先登录");
    return;
  }

  fetch(`${BASE_URL}/api/exportBing?langType=${selectedLang.value}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('导出失败');
    }
    return response.blob();
  })
  .then(blob => {
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${selectedLang.value}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    visible.value = false;
    ElMessage.success(`${selectedLang.value}.json文件导出成功`);
    selectedLang.value = "zh-CN"; // 重置选择
  })
  .catch(() => {
    ElMessage.error("导出json文件失败");
  });
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
