<template>
  <el-dialog
    v-model="visible"
    title="批量新增翻译项"
    width="30%"
    @close="handleClose"
  >
    <el-upload
      class="upload-demo"
      name="file"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      drag
      action="http://localhost:3000/api/batchUpload/translationItem"
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
        </div>
      </template>
    </el-upload>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus"; // Import ElMessage as a value
import { UploadFilled } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";
import axios from "axios";

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

const formRef = ref<FormInstance>();
const visible = ref(props.modelValue);
// 初始化表单数据

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
    ElMessage.error("仅支持Excel文件");
    return false;
  }
  return true;
};

// 可选：定义响应体类型
interface UploadResponse {
  code: number;
  data: {
    success: number;
    errors?: Array<{ row: number; message: string }>;
  };
  message: string;
}
// 处理成功响应
const handleSuccess = (response: UploadResponse) => {
  if (response.code === 200) {
    visible.value = false;
    ElMessage({
      message: `成功导入${response.data.success}条数据`,
      type: "success",
    });
    emit("submit");
  } else {
    ElMessage.error(response.message);
  }
};

// 错误处理
const handleError = (err: Error) => {
  ElMessage.error(`上传失败: ${err.message}`);
};

const handleClose = () => {
  formRef.value?.resetFields();
};

// 下载模板
const downloadTemplate = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/downloadTemplate",
      {
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "批量添加翻译项模板.xlsx");
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
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
</style>
