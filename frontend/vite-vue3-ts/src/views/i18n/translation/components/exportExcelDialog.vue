<template>
  <el-dialog
    v-model="visible"
    title="导出EXCEL文件"
    width="30%"
    :close-on-click-modal="false"
  >
    <div class="export-container">
      <el-form :model="exportForm" label-width="120px">
        <el-form-item label="导出选项">
          <el-checkbox v-model="exportForm.includeId">
            包含翻译项ID
          </el-checkbox>
        </el-form-item>
        <el-form-item label="文件说明">
          <div class="file-description">
            <p v-if="exportForm.includeId">
              将导出4列数据：翻译项ID、翻译项、翻译项-英文、翻译项-繁体
            </p>
            <p v-else>
              将导出3列数据：翻译项、翻译项-英文、翻译项-繁体
            </p>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleExport" :loading="exporting">
        导出EXCEL
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
const exporting = ref(false);

// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);
// 必须把弹窗的状态也同步给父组件，要不然下次打开的时候会有问题
watch(visible, (val) => emit("update:modelValue", val));

const exportForm = ref({
  includeId: false
});

const BASE_URL = import.meta.env.VITE_APP_API_BASE;

const handleExport = () => {
  if (exporting.value) return;
  
  exporting.value = true;

  // 使用 fetch 方式下载文件
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.error("请先登录");
    exporting.value = false;
    return;
  }

  fetch(`${BASE_URL}/api/exportExcel?includeId=${exportForm.value.includeId}`, {
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
    a.download = `翻译项数据_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    visible.value = false;
    ElMessage.success('EXCEL文件导出成功');
    exportForm.value.includeId = false; // 重置选择
  })
  .catch((error) => {
    console.error('导出EXCEL失败:', error);
    ElMessage.error("导出EXCEL文件失败");
  })
  .finally(() => {
    exporting.value = false;
  });
};
</script>

<style scoped>
.export-container {
  margin: 0 0 10px 0;
}

.file-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.file-description p {
  margin: 5px 0;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
}
</style>
