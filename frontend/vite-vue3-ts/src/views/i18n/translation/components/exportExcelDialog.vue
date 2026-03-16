<template>
  <el-dialog
    v-model="visible"
    title="导出EXCEL文件"
    width="35%"
    :close-on-click-modal="false"
  >
    <div class="export-container">
      <el-form :model="exportForm" label-width="120px">
        <el-form-item label="导出选项">
          <el-checkbox v-model="exportForm.includeId">
            包含翻译项ID
          </el-checkbox>
          <el-checkbox v-model="exportForm.includeProject" style="margin-left: 16px;">
            包含所属项目
          </el-checkbox>
        </el-form-item>
        <el-form-item label="文件说明">
          <div class="file-description">
            <p v-if="exportForm.includeId && exportForm.includeProject">
              将导出5列数据：翻译项ID、翻译项、翻译项-英文、翻译项-繁体、所属项目
            </p>
            <p v-else-if="exportForm.includeId">
              将导出4列数据：翻译项ID、翻译项、翻译项-英文、翻译项-繁体
            </p>
            <p v-else-if="exportForm.includeProject">
              将导出4列数据：翻译项、翻译项-英文、翻译项-繁体、所属项目
            </p>
            <p v-else>
              将导出3列数据：翻译项、翻译项-英文、翻译项-繁体
            </p>
            <p v-if="selectedProjectCodesForExport.length > 0" class="project-tip">
              将按当前列表所选项目筛选导出
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
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";

const props = withDefaults(
  defineProps<{ modelValue: boolean; selectedProjectCodes?: string[] }>(),
  { selectedProjectCodes: () => [] }
);
const emit = defineEmits(["update:modelValue"]);
const visible = ref(props.modelValue);
const exporting = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);
watch(visible, (val) => emit("update:modelValue", val));

const exportForm = ref({
  includeId: false,
  includeProject: false
});

const BASE_URL = import.meta.env.VITE_APP_API_BASE;

const selectedProjectCodesForExport = computed(() => props.selectedProjectCodes || []);

const handleExport = () => {
  if (exporting.value) return;
  
  exporting.value = true;

  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.error("请先登录");
    exporting.value = false;
    return;
  }

  let url = `${BASE_URL}/api/exportExcel?includeId=${exportForm.value.includeId}&includeProject=${exportForm.value.includeProject}`;
  if (selectedProjectCodesForExport.value.length > 0) {
    url += `&projectCodes=${selectedProjectCodesForExport.value.join(",")}`;
  }

  fetch(url, {
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
    exportForm.value.includeId = false;
    exportForm.value.includeProject = false;
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

.file-description .project-tip {
  color: var(--el-color-primary);
  font-size: 13px;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
}
</style>
