<template>
  <el-dialog
    v-model="visible"
    title="按JSON批量打标签"
    width="38%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="90px"
      class="tag-form"
    >
      <el-form-item label="所属项目" prop="selectedProjectCodes">
        <el-select
          v-model="formData.selectedProjectCodes"
          multiple
          placeholder="请选择所属项目"
          class="project-select"
          clearable
        >
          <el-option
            v-for="item in PROJECT_TAGS"
            :key="item.projectCode"
            :label="item.label"
            :value="item.projectCode"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <el-upload
      ref="uploadRef"
      class="upload-demo"
      name="file"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :auto-upload="false"
      drag
      :action="`${BASE_URL}/api/batchTagByJson`"
      :headers="uploadHeaders"
      :data="uploadData"
      :multiple="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽 JSON 文件到这里或者 <em>点击这里上传</em>
      </div>
    </el-upload>

    <div v-if="uploadResult" class="upload-result">
      <el-divider content-position="left">打标签结果</el-divider>
      <el-alert
        :title="responseMessage"
        :type="uploadResult.errors.length > 0 ? 'warning' : 'success'"
        show-icon
        :closable="false"
      />
      <div v-if="uploadResult.errors && uploadResult.errors.length > 0" class="error-list">
        <h4>错误详情：</h4>
        <el-table :data="uploadResult.errors" size="small" max-height="220">
          <el-table-column prop="row" label="行号" width="80" />
          <el-table-column prop="message" label="错误信息" />
        </el-table>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmitTag">
        打标签
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import type { FormInstance, FormRules, UploadInstance } from "element-plus";
import tokenManager from "../../../../utils/tokenManager";

const uploadRef = ref<UploadInstance>();
const formRef = ref<FormInstance>();
const BASE_URL = import.meta.env.VITE_APP_API_BASE || "http://localhost:3000";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue", "submit"]);

const visible = ref(props.modelValue);
const uploadResult = ref<any>(null);
const responseMessage = ref("");
const selectedFiles = ref<any[]>([]);
const submitting = ref(false);

const formData = reactive({
  selectedProjectCodes: [] as string[],
});

const rules = reactive<FormRules>({
  selectedProjectCodes: [
    {
      type: "array",
      required: true,
      message: "请选择所属项目标签",
      trigger: "change",
    },
  ],
});

const PROJECT_TAGS = [
  { label: "云管", projectCode: "cda_cem_client" },
  { label: "工作台", projectCode: "cem-quality-protal" },
  { label: "二级管", projectCode: "cutt_rpmp_porta" },
  { label: "订购页", projectCode: "cloud_computer_client" },
  { label: "控制台", projectCode: "computer_entconsole_client" },
  { label: "企业门户", projectCode: "ccemp-web" },
];

const uploadHeaders = {
  Authorization: `Bearer ${tokenManager.getToken()}`,
};

const uploadData = computed(() => ({
  projectCode: formData.selectedProjectCodes.join(","),
}));

watch(
  () => props.modelValue,
  (val) => (visible.value = val)
);
watch(visible, (val) => emit("update:modelValue", val));

const beforeUpload = (file: File) => {
  const isJson = file.name.toLowerCase().endsWith(".json");
  if (!isJson) {
    ElMessage.error("仅支持JSON文件(.json)");
    return false;
  }
  return true;
};

const handleSuccess = (response: any) => {
  submitting.value = false;
  uploadResult.value = response.data;
  responseMessage.value = response.message || "处理完成";
  emit("submit");
};

const handleError = (err: any) => {
  submitting.value = false;
  const msg = err?.message || "上传失败";
  ElMessage.error(msg);
};

const handleFileChange = (_file: any, fileList: any[]) => {
  selectedFiles.value = fileList;
};

const handleFileRemove = (_file: any, fileList: any[]) => {
  selectedFiles.value = fileList;
};

const handleSubmitTag = () => {
  formRef.value?.validate((valid) => {
    if (!valid) return;
    if (selectedFiles.value.length === 0) {
      ElMessage.warning("请先选择JSON文件");
      return;
    }
    submitting.value = true;
    uploadResult.value = null;
    responseMessage.value = "";
    uploadRef.value?.submit();
  });
};

const handleClose = () => {
  uploadRef.value?.clearFiles();
  formRef.value?.resetFields();
  uploadResult.value = null;
  responseMessage.value = "";
  selectedFiles.value = [];
  submitting.value = false;
  visible.value = false;
};
</script>

<style scoped>
.tag-form {
  margin-bottom: 12px;
}

.project-select {
  width: 100%;
}

.upload-result {
  margin-top: 20px;
}

.error-list {
  margin-top: 15px;
}

.error-list h4 {
  margin: 10px 0;
  color: #f56c6c;
}

.tips {
  margin-top: 8px;
  color: #606266;
}

.tips pre {
  margin-top: 6px;
  padding: 8px;
  background: #f8f8f8;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
