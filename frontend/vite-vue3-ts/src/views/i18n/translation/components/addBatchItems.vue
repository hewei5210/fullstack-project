<template>
  <el-dialog
    v-model="visible"
    title="批量新增翻译项"
    width="35%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="!isUploading"
    @close="handleClose"
  >
    <el-upload
      ref="uploadRef"
      class="upload-demo"
      name="file"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-remove="handleRemove"
      :disabled="isUploading"
      drag
      :action="`${BASE_URL}/api/batchUpload`"
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
            按照模板格式填写新增翻译项，并上传模板。
          </span>
        </div>
      </template>
    </el-upload>

    <!-- 显示上传状态 -->
    <div v-if="isUploading" class="upload-status">
      <el-divider content-position="left">处理中</el-divider>
      <div class="loading-container">
        <el-icon class="is-loading"><loading /></el-icon>
        <span class="loading-text">正在处理文件，请耐心等待...</span>
      </div>
    </div>

    <!-- 显示上传结果 -->
    <div v-if="uploadResult && !isUploading" class="upload-result">
      <el-divider content-position="left">上传结果</el-divider>
      <el-alert
        :title="responseMessage"
        :type="uploadResult.errors.length > 0 ? 'warning' : 'success'"
        show-icon
        :closable="false"
      />
      
      <div v-if="uploadResult.errors.length > 0" class="error-list">
        <h4>错误详情：</h4>
        <el-table :data="uploadResult.errors" size="small" max-height="200">
          <el-table-column prop="row" label="行号" />
          <el-table-column prop="message" label="错误信息" />
        </el-table>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose" :disabled="isUploading">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus"; // Import ElMessage as a value
import { UploadFilled, Loading } from "@element-plus/icons-vue";
import type { UploadInstance } from "element-plus";
import tokenManager from "../../../../utils/tokenManager";

const uploadRef = ref<UploadInstance>(); // 获取el-upload组件引用

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
const isUploading = ref(false);

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

// 新增 File 类型导入（可选，浏览器环境已内置）
declare global {
  interface File {
    readonly name: string;
    readonly size: number;
    readonly type: string;
  }
}
const beforeUpload = (file: File) => {
  const isExcel = [".xls", ".xlsx"].some((ext) => file.name.endsWith(ext));
  if (!isExcel) {
    ElMessage.error("仅支持Excel文件(.xls/.xlsx)");
    return false;
  }
  
  // 开始上传，设置上传状态
  isUploading.value = true;
  uploadResult.value = null;
  responseMessage.value = '';
  
  return true;
};

// 可选：定义响应体类型
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
  console.log('response', response);

  // 上传完成，重置上传状态
  isUploading.value = false;
  uploadResult.value = response.data;
  responseMessage.value = response.message;
  
  // ElMessage({
  //   message: response.message,
  //   type: "success",
  // });
  emit("submit");
};

// 错误处理
const handleError = (err: any) => {
  console.log('err', err);
  
  // 上传失败，重置上传状态
  isUploading.value = false;
  
  ElMessage.error(`上传失败: ${err.message}`);
};

const handleRemove = () => {
  // 当用户删除文件时，清空上传结果
  uploadResult.value = null;
  responseMessage.value = '';
};

const handleClose = () => {
  // 如果正在上传，不允许关闭
  if (isUploading.value) {
    return;
  }
  
  // 1. 清空文件列表
  uploadRef.value?.clearFiles();

  // 2. 清空上传结果
  uploadResult.value = null;
  responseMessage.value = '';

  // 3. 关闭弹窗
  visible.value = false;
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/downloadTemplate`, {
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
    link.setAttribute("download", "批量添加翻译项模板.xlsx");
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

.upload-stats {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.error-list {
  margin-top: 15px;
}

.error-list h4 {
  color: #dc3545;
  margin-bottom: 10px;
}

.upload-demo {
  margin-bottom: 20px;
}

.upload-status {
  margin-top: 20px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.loading-container .el-icon {
  font-size: 20px;
  margin-right: 10px;
  color: #409eff;
}

.loading-text {
  color: #606266;
  font-size: 14px;
}
</style>
