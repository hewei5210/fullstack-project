<template>
  <el-dialog
    v-model="visible"
    title="Excel转JSON"
    width="40%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="upload-container">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleRemove"
        :limit="1"
        accept=".xlsx,.xls"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽Excel文件到这里或者 <em>点击这里上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .xlsx 和 .xls 格式，文件应包含：翻译项ID、翻译项、翻译项-英文、翻译项-繁体
          </div>
        </template>
      </el-upload>

      <div v-if="fileList.length > 0" class="file-info">
        <el-divider content-position="left">文件信息</el-divider>
        <div class="file-item" v-for="file in fileList" :key="file.uid">
          <el-icon><Document /></el-icon>
          <span>{{ file.name }}</span>
          <span class="file-size">({{ formatFileSize(file.size || 0) }})</span>
        </div>
      </div>

      <!-- 转换结果详情（当数据不一致时显示） -->
      <div v-if="convertResult && !convertResult.isConsistent" class="convert-result">
        <el-divider content-position="left">转换结果详情</el-divider>
        <el-alert
          type="warning"
          :title="convertResult.title"
          :closable="false"
          show-icon
        >
          <template #default>
            
          </template>
        </el-alert>
        <div class="result-details">
              <p><strong>Excel总行数（不含表头）:</strong> {{ convertResult.totalRows }} 行</p>
              <p><strong>成功处理:</strong> {{ convertResult.processedRows }} 行</p>
              <p><strong>唯一key数量:</strong> {{ convertResult.uniqueKeyCount }} 个</p>
              <p><strong>生成文件:</strong></p>
              <ul>
                <li>zh-CN.json: {{ convertResult.zhCNCount }} 条</li>
                <li>en-US.json: {{ convertResult.enUSCount }} 条</li>
                <li>zh-HK.json: {{ convertResult.zhHKCount }} 条</li>
              </ul>
              <div v-if="convertResult.skippedRows > 0">
                <p><strong>跳过（key为空）:</strong> {{ convertResult.skippedRows }} 行</p>
              </div>
              <div v-if="convertResult.duplicateKeys && convertResult.duplicateKeys.length > 0">
                <p><strong>发现重复key:</strong> {{ convertResult.duplicateKeys.length }} 个（重复的key会被覆盖，导致数据丢失）</p>
              </div>
            </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button 
        type="primary" 
        @click="handleConvert" 
        :loading="converting"
        :disabled="fileList.length === 0"
      >
        转换为JSON并下载
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled, Document } from "@element-plus/icons-vue";
import type { UploadInstance, UploadFile } from "element-plus";
// @ts-ignore
import * as XLSX from "xlsx";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(["update:modelValue"]);

const visible = ref(props.modelValue);
const uploadRef = ref<UploadInstance>();
const fileList = ref<UploadFile[]>([]);
const converting = ref(false);
const convertResult = ref<any>(null);

// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);
watch(visible, (val) => emit("update:modelValue", val));

// 文件变化处理
const handleFileChange = (file: UploadFile) => {
  fileList.value = [file];
};

// 移除文件
const handleRemove = () => {
  fileList.value = [];
};

// 格式化文件大小
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// 关闭对话框
const handleClose = () => {
  uploadRef.value?.clearFiles();
  fileList.value = [];
  convertResult.value = null;
  visible.value = false;
};

// 转换Excel为JSON
const handleConvert = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning("请先上传Excel文件");
    return;
  }

  converting.value = true;
  try {
    const file = fileList.value[0].raw;
    if (!file) {
      throw new Error("文件不存在");
    }

    // 读取Excel文件
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 转换为数组格式（按行读取，包含表头，不跳过空行）
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      blankrows: true // 不跳过空行
    });
    
    if (jsonData.length === 0) {
      throw new Error("Excel文件为空");
    }

    // 跳过表头（第一行）
    const dataRows = jsonData.slice(1) as any[][];
    
    // 构建JSON数据
    // 第一列作为key，第二列作为zh-CN的值，第三列作为en-US的值，第四列作为zh-HK的值
    const zhCNJson: Record<string, string> = {};
    const enUSJson: Record<string, string> = {};
    const zhHKJson: Record<string, string> = {};

    let totalRows = 0;
    let skippedRows = 0;
    let processedRows = 0;
    const duplicateKeysInfo: Array<{ key: string; rows: number[] }> = [];
    const keyMap = new Map<string, number[]>(); // key -> 行号数组

    dataRows.forEach((row: any[], index: number) => {
      totalRows++;
      
      // 第一列：翻译项ID（作为key）
      const key = (row[0] || '').toString().trim();
      // 第二列：翻译项（zh-CN的值）
      const zhCN = (row[1] || '').toString().trim();
      // 第三列：翻译项-英文（en-US的值）
      const enUS = (row[2] || '').toString().trim();
      // 第四列：翻译项-繁体（zh-HK的值）
      const zhHK = (row[3] || '').toString().trim();

      // 如果key为空，使用行号作为key（确保所有行都被处理）
      const finalKey = key || `ROW_${index + 2}`;
      const rowNumber = index + 2; // Excel行号（+2因为表头占1行，索引从0开始）
      
      if (!key) {
        skippedRows++;
        console.warn(`第 ${rowNumber} 行：第一列（key）为空，使用行号作为key: ${finalKey}`);
      } else {
        // 记录每个key出现的行号
        if (!keyMap.has(key)) {
          keyMap.set(key, []);
        }
        keyMap.get(key)!.push(rowNumber);
      }

      // 检测重复的key（当第二次遇到同一个key时，记录到重复列表）
      if (key && keyMap.has(key) && keyMap.get(key)!.length === 2) {
        // 第一次发现重复，记录这个key和所有出现的行号
        duplicateKeysInfo.push({
          key: key,
          rows: [...keyMap.get(key)!]
        });
        console.warn(`发现重复的key "${key}"，出现在第 ${keyMap.get(key)!.join(', ')} 行`);
      } else if (key && keyMap.has(key) && keyMap.get(key)!.length > 2) {
        // 如果已经有3次或更多，更新行号列表
        const existing = duplicateKeysInfo.find(item => item.key === key);
        if (existing) {
          existing.rows = [...keyMap.get(key)!];
        }
      }

      // 设置JSON数据（即使值为空也设置，确保所有key都被记录）
      // 注意：即使zhCN为空，也要添加key，使用空字符串
      zhCNJson[finalKey] = zhCN || '';
      if (enUS) enUSJson[finalKey] = enUS;
      if (zhHK) zhHKJson[finalKey] = zhHK;
      
      processedRows++;
    });

    // 下载JSON文件
    const downloadJson = (data: Record<string, string>, filename: string) => {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    // 依次下载三个JSON文件
    downloadJson(zhCNJson, 'zh-CN.json');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (Object.keys(enUSJson).length > 0) {
      downloadJson(enUSJson, 'en-US.json');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (Object.keys(zhHKJson).length > 0) {
      downloadJson(zhHKJson, 'zh-HK.json');
    }

    // 构建统计信息
    const zhCNCount = Object.keys(zhCNJson).length;
    const enUSCount = Object.keys(enUSJson).length;
    const zhHKCount = Object.keys(zhHKJson).length;
    const uniqueKeyCount = keyMap.size;
    
    // 检查数据是否一致
    const isConsistent = totalRows === zhCNCount && totalRows === uniqueKeyCount && skippedRows === 0 && duplicateKeysInfo.length === 0;
    
    // 保存转换结果（用于在弹窗中显示）
    convertResult.value = {
      isConsistent,
      totalRows,
      processedRows,
      skippedRows,
      uniqueKeyCount,
      zhCNCount,
      enUSCount,
      zhHKCount,
      duplicateKeys: duplicateKeysInfo,
      title: isConsistent 
        ? '转换成功' 
        : `数据不一致：Excel有${totalRows}行，但JSON只有${zhCNCount}条数据`
    };
    
    console.log('转换统计:', { 
      totalRows, 
      processedRows, 
      skippedRows, 
      uniqueKeyCount,
      duplicateKeysCount: duplicateKeysInfo.length,
      duplicateKeys: duplicateKeysInfo.slice(0, 20),
      zhCNCount, 
      enUSCount, 
      zhHKCount,
      isConsistent
    });
    
    // 如果数据一致，只显示简单提示；如果不一致，详细信息会在弹窗中显示
    if (isConsistent) {
      ElMessage.success('转换成功！');
      handleClose();
    } else {
      // 数据不一致时，不关闭弹窗，让用户查看详细信息
      ElMessage.warning('转换完成，但数据不一致，请查看下方详情');
    }
  } catch (error) {
    console.error('转换失败:', error);
    ElMessage.error(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    converting.value = false;
  }
};
</script>

<style scoped>
.upload-container {
  margin: 20px 0;
}

.upload-demo {
  width: 100%;
}

.file-info {
  margin-top: 20px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-top: 10px;
}

.file-size {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

:deep(.el-upload__tip) {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.convert-result {
  margin-top: 20px;
}

.result-details {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.8;
}

.result-details p {
  margin: 8px 0;
}

.result-details ul {
  margin: 8px 0;
  padding-left: 20px;
}

.result-details li {
  margin: 4px 0;
}
</style>
