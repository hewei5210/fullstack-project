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

const handleExport = () => {
  if (!selectedLang.value) {
    ElMessage.warning("请先选择导出类型");
    return;
  }

  // 创建隐藏的 iframe
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = `http://localhost:3000/api/exportBing?lang=${selectedLang.value}`;
  document.body.appendChild(iframe);

  setTimeout(() => {
    document.body.removeChild(iframe);
    visible.value = false;
    selectedLang.value = "zh-CN"; // 重置选择
    ElMessage.success("导出成功");
  }, 1000);
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
