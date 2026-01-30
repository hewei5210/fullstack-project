<template>
  <el-dialog
    v-model="visible"
    title="批量获取翻译项ID"
    width="35%"
    :close-on-click-modal="false"
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
      drag
      :action="`${BASE_URL}/api/batchGetIds`"
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
            可以上传批量新增翻译项的Excel文件，获取新增翻译项的ID，便于之后的批量修改翻译项或者删除翻译项。
          </span>
        </div>
      </template>
    </el-upload>

    <!-- 显示上传结果 -->
    <div v-if="uploadResult" class="upload-result">
      <el-divider content-position="left">获取结果</el-divider>
      <el-alert
        :title="responseMessage"
        :type="uploadResult.errors.length > 0 ? 'warning' : 'success'"
        show-icon
        :closable="false"
      />
      
      <!-- 成功获取的数据预览 -->
      <div v-if="uploadResult.data && uploadResult.data.length > 0" class="success-data">
        <h4>成功获取的数据预览：</h4>
        <el-table :data="uploadResult.data.slice(0, 5)" size="small" max-height="200">
          <el-table-column prop="id" label="翻译项ID" width="150" />
          <el-table-column prop="source" label="翻译项" show-overflow-tooltip />
          <el-table-column prop="en-US" label="翻译项-英文" show-overflow-tooltip />
          <el-table-column prop="zh-HK" label="翻译项-繁体" show-overflow-tooltip />
        </el-table>
        <div v-if="uploadResult.data.length > 5" class="data-preview-tip">
          仅显示前5条数据，共 {{ uploadResult.data.length }} 条数据
        </div>
        
        <!-- 导出按钮 -->
        <div class="export-section">
          <el-button 
            type="success" 
            :icon="Download" 
            @click="exportResult"
            :loading="exporting"
          >
            导出Excel文件
          </el-button>
        </div>
      </div>
      
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
import { UploadFilled, Download } from "@element-plus/icons-vue";
import type { UploadInstance } from "element-plus";
import tokenManager from "../../../../utils/tokenManager";
// @ts-ignore
import * as XLSX from "xlsx";

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
const exporting = ref(false);

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

// 批量获取ID的数据项类型
interface BatchGetIdItem {
  id: string;
  source: string;
  'en-US': string;
  'zh-HK': string;
}

// 响应体类型
interface UploadResponse {
  status: number;
  data: {
    success: number;
    total: number;
    data?: Array<BatchGetIdItem>;
    errors?: Array<{ row: number; message: string }>;
  };
  message: string;
}

// 处理成功响应
const handleSuccess = (response: UploadResponse) => {
  if (response.status === 200) {
    uploadResult.value = response.data;
    responseMessage.value = response.message;
    emit("submit");
  } 
};

// 错误处理
const handleError = (err: Error) => {
  ElMessage.error(`上传失败: ${err.message}`);
};

const handleRemove = () => {
  // 当用户删除文件时，清空上传结果
  uploadResult.value = null;
  responseMessage.value = '';
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
    const response = await fetch(`${BASE_URL}/api/downloadGetIdsTemplate`, {
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
    link.setAttribute("download", "批量获取翻译项ID模板.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    ElMessage.success("模板下载成功");
  } catch (error) {
    ElMessage.error("模板下载失败");
  }
};

// 导出结果 - 在前端直接生成Excel，避免发送大量数据到后端
const exportResult = async () => {
  if (!uploadResult.value?.data || uploadResult.value.data.length === 0) {
    ElMessage.warning("没有可导出的数据");
    return;
  }

  exporting.value = true;
  try {
    // 准备Excel数据
    const excelData = uploadResult.value.data.map((item: BatchGetIdItem) => ({
      '翻译项ID': item.id || '',
      '翻译项': item.source || '',
      '翻译项-英文': item['en-US'] || '',
      '翻译项-繁体': item['zh-HK'] || ''
    }));

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 }, // 翻译项ID
      { wch: 30 }, // 翻译项
      { wch: 30 }, // 翻译项-英文
      { wch: 30 }  // 翻译项-繁体
    ];
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '翻译项ID结果');
    
    // 生成Excel文件并下载
    const fileName = `翻译项ID结果_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    ElMessage.success(`Excel文件导出成功，共 ${uploadResult.value.data.length} 条数据`);
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    exporting.value = false;
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

.success-data {
  margin-top: 15px;
}

.success-data h4 {
  margin: 10px 0;
  color: #67c23a;
}

.data-preview-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
  text-align: center;
}

.export-section {
  margin-top: 15px;
  text-align: center;
}

.error-list {
  margin-top: 15px;
}

.error-list h4 {
  margin: 10px 0;
  color: #f56c6c;
}
</style>
