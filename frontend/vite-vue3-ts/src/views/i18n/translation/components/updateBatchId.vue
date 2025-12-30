<template>
  <el-dialog
    v-model="visible"
    title="批量修改翻译项"
    width="35%"
    @close="handleClose"
  >
    <el-upload
      ref="uploadRef"
      class="upload-demo"
      name="file"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      drag
      :action="`${BASE_URL}/api/batchUpdate`"
      :headers="uploadHeaders"
      multiple
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽文件到这里或者 <em>点击这里上传</em>
      </div>
      <template #tip>
        <div>
          <el-link
            type="primary"
            :underline="false"
            style="font-size: small; margin-left: 10px"
            @click="downloadTemplate"
          >
            点击下载Excel模板
          </el-link>
          <span style="font-size: small; margin-left: 10px">
            可以通过批量获取翻译项ID功能，批量获取所需修改翻译项的ID，便于批量修改翻译项。
          </span>
        </div>
      </template>
    </el-upload>

    <!-- 显示上传结果 -->
    <div v-if="uploadResult" class="upload-result">
      <el-divider content-position="left">修改结果</el-divider>
      <el-alert
        :title="responseMessage"
        :type="uploadResult.errors.length > 0 ? 'warning' : 'success'"
        show-icon
        :closable="false"
      />
      
      <div v-if="uploadResult.errors && uploadResult.errors.length > 0" class="error-list">
        <h4>错误详情：</h4>
        <el-table :data="uploadResult.errors" size="small" max-height="200">
          <el-table-column prop="row" label="行号" width="80" />
          <el-table-column prop="message" label="错误信息" />
        </el-table>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import type { UploadInstance } from "element-plus";
import tokenManager from "../../../../utils/tokenManager";

const uploadRef = ref<UploadInstance>();

const BASE_URL = import.meta.env.VITE_APP_API_BASE || "http://localhost:3000";

interface TranslationItem {
  id: string;
  source: string;
  target: {
    "zh-CN": string;
    "en-US": string;
    "zh-HK": string;
  };
}

const props = defineProps<{
  modelValue: boolean;
  initialData?: TranslationItem;
}>();

const emit = defineEmits(["update:modelValue", "submit"]);

const visible = ref(props.modelValue);
const uploadResult = ref<any>(null);
const responseMessage = ref<string>('');

// 上传请求头
const uploadHeaders = {
  'Authorization': `Bearer ${tokenManager.getToken()}`
};

// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => (visible.value = val)
);
watch(visible, (val) => emit("update:modelValue", val));

// 文件类型检查
const beforeUpload = (file: File) => {
  const isExcel = [".xls", ".xlsx"].some((ext) => file.name.endsWith(ext));
  if (!isExcel) {
    ElMessage.error("仅支持Excel文件(.xls/.xlsx)");
    return false;
  }
  return true;
};

// 响应体类型
interface UploadResponse {
  status: number;
  data: {
    success: number;
    total: number;
    errors?: Array<{ row: number; message: string }>;
  };
  message: string;
}

// 处理成功响应
const handleSuccess = (response: UploadResponse) => {
  uploadResult.value = response.data;
  responseMessage.value = response.message;
  emit("submit");
};

// 错误处理
const handleError = (err: Error) => {
  ElMessage.error(`上传失败: ${err.message}`);
};

const handleClose = () => {
  // 1. 清空文件列表
  uploadRef.value?.clearFiles();

  // 2. 清空上传结果
  uploadResult.value = null;

  // 3. 关闭弹窗
  visible.value = false;
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/downloadUpdateTemplate`, {
      headers: {
        'Authorization': `Bearer ${tokenManager.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('下载失败');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "批量修改翻译项模板.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    ElMessage.success("模板下载成功");
  } catch (error) {
    console.error('下载模板失败:', error);
    ElMessage.error("模板下载失败");
  }
};
</script>

<style scoped>
.inline-container {
  display: flex;
  align-items: center;
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
</style>
