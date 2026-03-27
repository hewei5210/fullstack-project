<template>
  <div class="container">
    <div class="translation-auto-content">
      <div class="steps-container">
        <!-- 顶部步骤条 -->
        <div class="steps-header">
          <el-steps :active="currentStep" finish-status="success">
            <el-step title="提取中文文本" />
            <el-step title="中文文本去重" />
            <el-step title="AI翻译" />
          </el-steps>
        </div>

        <!-- 内容区域 -->
        <div class="steps-content">
          <!-- 步骤1: 提取中文文本 -->
          <div v-show="currentStep === 0" class="step-panel">
            <h3>提取中文文本</h3>
            <div class="step-content">
              <!-- 上传区域 -->
              <div class="upload-section">
                <el-upload
                  v-if="uploadMode === 'file'"
                  ref="uploadRef"
                  class="upload-demo"
                  drag
                  :auto-upload="false"
                  :multiple="true"
                  :accept="'.vue,.js,.css,.html,.json'"
                  :on-change="handleFileChange"
                  :on-remove="handleFileRemove"
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    将文件拖到此处，或<em>点击上传</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持上传 .vue、.js、.css、.html、.json 文件
                    </div>
                  </template>
                </el-upload>

                <div
                  v-else
                  class="folder-upload-box"
                  @click="triggerFolderSelect"
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    点击选择文件夹（支持递归读取子目录）
                  </div>
                  <div class="el-upload__tip">
                    仅会处理 .vue、.js、.css、.html、.json 文件
                  </div>
                  <input
                    ref="folderInputRef"
                    type="file"
                    webkitdirectory
                    directory
                    multiple
                    accept=".vue,.js,.css,.html,.json"
                    class="folder-input-hidden"
                    @change="handleFolderInputChange"
                  />
                </div>
                <div
                  v-if="uploadMode === 'folder' && fileList.length > 0"
                  class="folder-file-list"
                >
                  <div class="folder-file-list__header">
                    已选择文件（{{ fileList.length }}）
                  </div>
                  <div class="folder-file-list__body">
                    <div
                      v-for="(f, idx) in fileList"
                      :key="`${(f as any).webkitRelativePath || f.name}-${f.size}-${idx}`"
                      class="folder-file-list__item"
                    >
                      <span
                        class="folder-file-list__name"
                        :title="(f as any).webkitRelativePath || f.name"
                      >
                        {{ (f as any).webkitRelativePath || f.name }}
                      </span>
                      <el-button
                        type="danger"
                        link
                        size="small"
                        @click.stop="removeFolderFile(f)"
                      >
                        移除
                      </el-button>
                    </div>
                  </div>
                </div>
                <div class="upload-actions">
                  <el-radio-group v-model="uploadMode" size="small">
                    <el-radio-button label="file">单个文件</el-radio-button>
                    <el-radio-button label="folder">文件夹</el-radio-button>
                  </el-radio-group>
                  <el-button
                    type="primary"
                    :icon="Document"
                    @click="handleExtract"
                    :loading="extracting"
                    :disabled="fileList.length === 0"
                    style="margin-left: 20px"
                  >
                    开始提取
                  </el-button>
                  <el-button
                    type="success"
                    :icon="Download"
                    @click="handleExportExcel"
                    :disabled="extractResult.length === 0"
                    style="margin-left: 10px"
                  >
                    导出Excel
                  </el-button>
                  <el-button
                    type="primary"
                    plain
                    @click="goToStep2"
                    :disabled="extractResult.length === 0"
                    style="margin-left: 10px"
                  >
                    下一步
                  </el-button>
                </div>
              </div>

              <!-- 结果展示 -->
              <div v-if="extractResult.length > 0" class="result-section">
                <div class="result-header">
                  <span>提取结果（共 {{ totalTextCount }} 条）</span>
                </div>
                <el-table
                  :data="extractResult"
                  stripe
                  style="width: 100%"
                  max-height="400"
                >
                  <el-table-column prop="fileName" label="文件名" width="200" />
                  <el-table-column
                    prop="textCount"
                    label="提取数量"
                    width="120"
                  />
                  <el-table-column label="提取内容" min-width="300">
                    <template #default="scope">
                      <div class="text-list">
                        <el-tag
                          v-for="(text, index) in scope.row.texts.slice(0, 5)"
                          :key="index"
                          size="small"
                          style="margin: 2px"
                        >
                          {{ text }}
                        </el-tag>
                        <span
                          v-if="scope.row.texts.length > 5"
                          class="more-text"
                        >
                          ... 还有 {{ scope.row.texts.length - 5 }} 条
                        </span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100" fixed="right">
                    <template #default="scope">
                      <el-button
                        type="primary"
                        link
                        @click="openExtractDetail(scope.$index)"
                      >
                        详情
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <el-dialog
                v-model="extractDetailDialogVisible"
                title="提取内容详情"
                width="900px"
                destroy-on-close
              >
                <div v-if="currentDetailFile" class="detail-file-name">
                  文件：{{ currentDetailFile.fileName }}
                </div>
                <el-table
                  :data="detailTableData"
                  stripe
                  max-height="450"
                  style="width: 100%"
                >
                  <el-table-column label="序号" width="80">
                    <template #default="scope">
                      {{ scope.row.index + 1 }}
                    </template>
                  </el-table-column>
                  <el-table-column label="提取内容">
                    <template #default="scope">
                      <el-input
                        v-model="detailTexts[scope.row.index]"
                        placeholder="请输入提取内容"
                        clearable
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template #default="scope">
                      <el-button
                        type="danger"
                        link
                        @click="handleDeleteDetailText(scope.row.index)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <template #footer>
                  <div>
                    <el-button @click="extractDetailDialogVisible = false"
                      >取消</el-button
                    >
                    <el-button type="primary" @click="handleSaveDetailTexts">
                      保存
                    </el-button>
                  </div>
                </template>
              </el-dialog>
            </div>
          </div>

          <!-- 步骤2: 中文文本去重 -->
          <div v-show="currentStep === 1" class="step-panel">
            <h3>中文文本去重</h3>
            <div class="step-content">
              <!-- 操作区域 -->
              <div class="dedupe-section">
                <div class="dedupe-info">
                  <el-alert
                    v-if="step1Texts.length === 0"
                    title="请先完成第一步：提取中文文本"
                    type="warning"
                    :closable="false"
                    show-icon
                  />
                  <div v-else class="info-stats">
                    <el-statistic
                      title="提取文本总数"
                      :value="displayTotalTextCount"
                    />
                    <el-statistic
                      title="去重后数量"
                      :value="displayUniqueCount"
                    />
                    <el-statistic title="重复数量" :value="displayDuplicateCount" />
                  </div>
                </div>
                <div class="dedupe-actions">
                  <el-button @click="goToStep1">上一步</el-button>
                  <el-button
                    type="primary"
                    :icon="Search"
                    @click="handleDedupe"
                    :loading="deduping"
                    :disabled="step1Texts.length === 0"
                    style="margin-left: 10px"
                  >
                    开始去重校验
                  </el-button>
                  <el-button
                    type="success"
                    :icon="Download"
                    @click="handleExportDedupeResult"
                    :disabled="dedupeResult.length === 0"
                    style="margin-left: 10px"
                  >
                    导出结果
                  </el-button>
                  <el-button
                    type="primary"
                    plain
                    @click="goToStep3"
                    :disabled="dedupeResult.length === 0"
                    style="margin-left: 10px"
                  >
                    下一步
                  </el-button>
                </div>
              </div>

              <!-- 结果展示 -->
              <div v-if="dedupeResult.length > 0" class="result-section">
                <div class="result-header">
                  <span>去重结果：</span>
                  <el-tag type="success">新增: {{ newTextCount }}</el-tag>
                  <el-tag type="warning" style="margin-left: 10px">
                    重复: {{ duplicateTextCount }}
                  </el-tag>
                </div>
                <el-table
                  :data="dedupeResult"
                  stripe
                  style="width: 100%"
                  max-height="400"
                >
                  <el-table-column
                    prop="text"
                    label="中文文本"
                    min-width="300"
                  />
                  <el-table-column label="状态" width="120">
                    <template #default="scope">
                      <el-tag
                        :type="scope.row.isDuplicate || scope.row.dbMatch ? 'warning' : 'success'"
                        size="small"
                      >
                        {{ scope.row.isDuplicate || scope.row.dbMatch ? "重复" : "新增" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="数据库匹配" width="150">
                    <template #default="scope">
                      <el-tag v-if="scope.row.dbMatch" type="info" size="small">
                        已存在
                      </el-tag>
                      <span v-else style="color: #909399">--</span>
                    </template>
                  </el-table-column>
                  <!-- <el-table-column label="出现次数" width="120">
                    <template #default="scope">
                      <span>{{ scope.row.count }}</span>
                    </template>
                  </el-table-column> -->
                </el-table>
              </div>
            </div>
          </div>

          <!-- 步骤3: AI翻译 -->
          <div v-show="currentStep === 2" class="step-panel">
            <h3>AI翻译</h3>
            <div class="step-content">
              <!-- 操作区域 -->
              <div class="translate-section">
                <div class="translate-info">
                  <el-alert
                    v-if="textsToTranslate.length === 0"
                    title="请先完成第二步：中文文本去重"
                    type="warning"
                    :closable="false"
                    show-icon
                  />
                  <div v-else class="info-stats">
                    <el-statistic
                      title="待翻译文本"
                      :value="textsToTranslate.length"
                    />
                    <el-statistic title="已翻译" :value="displayTranslatedCount" />
                    <el-statistic title="翻译失败" :value="displayFailedCount" />
                    <el-statistic
                      title="待导入数据库"
                      :value="displayPendingImportCount"
                    />
                    <el-statistic
                      title="已导入数据库"
                      :value="displayImportedSuccessCount"
                    />
                  </div>
                </div>
                <div v-if="!showAllImportedSuccess" class="translate-actions">
                  <el-button @click="goToStep2">上一步</el-button>
                  <el-button
                    type="primary"
                    :icon="Search"
                    @click="handleTranslate"
                    :loading="translating"
                    :disabled="textsToTranslate.length === 0"
                    style="margin-left: 10px"
                  >
                    开始翻译
                  </el-button>
                  <el-button
                    type="success"
                    :icon="Download"
                    @click="handleExportTranslateResult"
                    :disabled="translateResult.length === 0"
                    style="margin-left: 10px"
                  >
                    导出Excel
                  </el-button>
                  <el-button
                    type="warning"
                    @click="handleImportTranslateToDB"
                    :loading="importingToDb"
                    :disabled="translateResult.length === 0"
                    style="margin-left: 10px"
                  >
                    导入数据库
                  </el-button>
                </div>

                <div
                  v-if="importSummary && !showAllImportedSuccess"
                  class="import-result-section"
                >
                  <el-alert
                    :title="importSummary.message"
                    :type="importSummary.failCount > 0 ? 'warning' : 'success'"
                    :closable="false"
                    show-icon
                  />
                  <el-table
                    v-if="importSummary.failItems.length > 0"
                    :data="importSummary.failItems"
                    stripe
                    size="small"
                    style="width: 100%; margin-top: 12px"
                    max-height="220"
                  >
                    <el-table-column
                      prop="source"
                      label="失败翻译项"
                      min-width="260"
                      show-overflow-tooltip
                    />
                    <el-table-column
                      prop="reason"
                      label="失败原因"
                      min-width="260"
                      show-overflow-tooltip
                    />
                  </el-table>
                </div>

                <el-alert
                  v-if="showAllImportedSuccess"
                  class="all-imported-alert"
                  title="你已成功导入所有翻译项！"
                  type="success"
                  :closable="false"
                  show-icon
                >
                  <template #default>
                    <div class="celebrate-gif-like" aria-hidden="true">
                      <span class="confetti-item">🎉</span>
                      <span class="confetti-item">✨</span>
                      <span class="confetti-item">🎊</span>
                      <span class="confetti-item">🌟</span>
                      <span class="confetti-item">🎉</span>
                    </div>
                    <el-button
                      type="success"
                      plain
                      size="small"
                      @click="resetTranslationAutomation"
                    >
                      重新返回翻译项自动化
                    </el-button>
                  </template>
                </el-alert>
              </div>

              <!-- 翻译进度 -->
              <div v-if="translating" class="progress-section">
                <el-progress
                  :percentage="translateProgress"
                  :status="translateProgress === 100 ? 'success' : undefined"
                />
                <div class="progress-text">
                  正在翻译 {{ currentTranslateIndex + 1 }} /
                  {{ textsToTranslate.length }}
                </div>
              </div>

              <!-- 结果展示 -->
              <div
                v-if="translateResult.length > 0 && !showAllImportedSuccess"
                class="result-section"
              >
                <div class="result-header">
                  <span>翻译结果（共 {{ translateResult.length }} 条）</span>
                </div>
                <el-table
                  :data="translateResult"
                  stripe
                  style="width: 100%"
                  max-height="400"
                >
                  <el-table-column
                    prop="source"
                    label="翻译项"
                    min-width="250"
                  />
                  <el-table-column
                    prop="target.en-US"
                    label="翻译项-英文"
                    min-width="250"
                  >
                    <template #default="scope">
                      <span :class="{ 'error-text': scope.row.error }">
                        {{
                          scope.row.target["en-US"] ||
                          (scope.row.error ? "翻译失败" : "--")
                        }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="target.zh-HK"
                    label="翻译项-繁体"
                    min-width="250"
                  >
                    <template #default="scope">
                      <span :class="{ 'error-text': scope.row.error }">
                        {{
                          scope.row.target["zh-HK"] ||
                          (scope.row.error ? "翻译失败" : "--")
                        }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="100">
                    <template #default="scope">
                      <el-tag
                        :type="scope.row.error ? 'danger' : 'success'"
                        size="small"
                      >
                        {{ scope.row.error ? "失败" : "成功" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140" fixed="right">
                    <template #default="scope">
                      <el-button
                        type="primary"
                        link
                        @click="openTranslateEditDialog(scope.$index)"
                      >
                        编辑
                      </el-button>
                      <el-button
                        type="danger"
                        link
                        @click="handleDeleteTranslateItem(scope.$index)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <el-dialog
                v-model="translateEditDialogVisible"
                title="编辑翻译项"
                width="700px"
                destroy-on-close
              >
                <el-form :model="translateEditForm" label-width="100px">
                  <el-form-item label="翻译项">
                    <el-input
                      v-model="translateEditForm.source"
                      placeholder="请输入翻译项"
                      clearable
                    />
                  </el-form-item>
                  <el-form-item label="翻译项-英文">
                    <el-input
                      v-model="translateEditForm.enUS"
                      placeholder="请输入英文翻译"
                      clearable
                    />
                  </el-form-item>
                  <el-form-item label="翻译项-繁体">
                    <el-input
                      v-model="translateEditForm.zhHK"
                      placeholder="请输入繁体翻译"
                      clearable
                    />
                  </el-form-item>
                </el-form>
                <template #footer>
                  <div>
                    <el-button @click="translateEditDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSaveTranslateEdit">
                      保存
                    </el-button>
                  </div>
                </template>
              </el-dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  UploadFilled,
  Document,
  Download,
  Search,
} from "@element-plus/icons-vue";
// @ts-ignore
import * as XLSX from "xlsx";
import { http } from "@/net/http";
import { callBailianAPI } from "@/utils/bailianAPI";

interface FileData {
  fileName: string;
  texts: string[];
  textCount: number;
}

const currentStep = ref(0);
const uploadRef = ref();
const folderInputRef = ref<HTMLInputElement | null>(null);
const uploadMode = ref<"file" | "folder">("file");
const fileList = ref<File[]>([]);
const extracting = ref(false);
const extractResult = ref<FileData[]>([]);
const extractDetailDialogVisible = ref(false);
const currentDetailRowIndex = ref(-1);
const detailTexts = ref<string[]>([]);

// 第二步相关数据
interface DedupeResult {
  text: string;
  isDuplicate: boolean; // 是否在提取结果中重复
  dbMatch: boolean; // 是否在数据库中已存在
  count: number; // 在提取结果中出现的次数
}

const step1Texts = computed(() => {
  // 收集第一步的所有文本
  const allTexts: string[] = [];
  extractResult.value.forEach((fileData) => {
    allTexts.push(...fileData.texts);
  });
  return allTexts;
});

const uniqueTexts = computed(() => {
  // 去重后的文本
  return [...new Set(step1Texts.value)];
});

const deduping = ref(false);
const dedupeResult = ref<DedupeResult[]>([]);
const hasDedupeChecked = ref(false);

const newTextCount = computed(() => {
  return dedupeResult.value.filter((item) => !item.isDuplicate && !item.dbMatch)
    .length;
});

const duplicateTextCount = computed(() => {
  return dedupeResult.value.filter((item) => item.isDuplicate || item.dbMatch)
    .length;
});

const displayTotalTextCount = computed(() => {
  return step1Texts.value.length;
});

const displayUniqueCount = computed(() => {
  if (!hasDedupeChecked.value) {
    return "--";
  }
  return Math.max(0, step1Texts.value.length - duplicateTextCount.value);
});

const displayDuplicateCount = computed(() => {
  if (!hasDedupeChecked.value) {
    return "--";
  }
  if (dedupeResult.value.length > 0) {
    return duplicateTextCount.value;
  }
  return 0;
});

// 第三步相关数据
interface TranslateResult {
  source: string;
  target: {
    "en-US": string;
    "zh-HK": string;
  };
  error?: boolean;
  imported?: boolean;
}

const textsToTranslate = computed(() => {
  // 获取第二步去重后的新增文本（非重复且数据库不存在的）
  return dedupeResult.value
    .filter((item) => !item.isDuplicate && !item.dbMatch)
    .map((item) => item.text);
});

const translating = ref(false);
const translateResult = ref<TranslateResult[]>([]);
const translateProgress = ref(0);
const currentTranslateIndex = ref(0);
const importingToDb = ref(false);
const hasTranslateExecuted = ref(false);
const hasImportExecuted = ref(false);
const importSummary = ref<{
  totalCount: number;
  successCount: number;
  failCount: number;
  message: string;
  failItems: Array<{ source: string; reason: string }>;
} | null>(null);
const translateEditDialogVisible = ref(false);
const currentEditTranslateIndex = ref(-1);
const translateEditForm = ref({
  source: "",
  enUS: "",
  zhHK: "",
});

const translatedCount = computed(() => {
  return translateResult.value.filter((item) => !item.error).length;
});

const failedCount = computed(() => {
  return translateResult.value.filter((item) => item.error).length;
});

const displayTranslatedCount = computed(() => {
  return hasTranslateExecuted.value ? translatedCount.value : "--";
});

const displayFailedCount = computed(() => {
  return hasTranslateExecuted.value ? failedCount.value : "--";
});

const importableCount = computed(() => {
  return translateResult.value.filter((item) => !item.error).length;
});

const importedSuccessCount = computed(() => {
  return translateResult.value.filter((item) => !item.error && item.imported).length;
});

const pendingImportCount = computed(() => {
  return Math.max(0, importableCount.value - importedSuccessCount.value);
});

const displayPendingImportCount = computed(() => {
  return hasImportExecuted.value ? pendingImportCount.value : "--";
});

const displayImportedSuccessCount = computed(() => {
  return hasImportExecuted.value ? importedSuccessCount.value : "--";
});

const showAllImportedSuccess = computed(() => {
  return importableCount.value > 0 && pendingImportCount.value === 0;
});

// 匹配中文的正则表达式
const chineseRegex = /[\u4e00-\u9fa5]+/g;
// 处理 HTML 注释、JS 多行/单行注释
const commentRegex = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/.*/g;
const validExtensions = [".vue", ".js", ".css", ".html", ".json"];

// 总文本数量
const totalTextCount = computed(() => {
  return extractResult.value.reduce((sum, item) => sum + item.textCount, 0);
});

const currentDetailFile = computed(() => {
  if (currentDetailRowIndex.value < 0) {
    return null;
  }
  return extractResult.value[currentDetailRowIndex.value] || null;
});

const detailTableData = computed(() => {
  return detailTexts.value.map((text, index) => ({ text, index }));
});

// 监听上传模式变化，清空文件列表
watch(uploadMode, () => {
  fileList.value = [];
  extractResult.value = [];
  hasDedupeChecked.value = false;
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  if (folderInputRef.value) {
    folderInputRef.value.value = "";
  }
});

const isValidFile = (rawFile: File) => {
  const fileName = rawFile.name.toLowerCase();
  return validExtensions.some((ext) => fileName.endsWith(ext));
};

const pushRawFile = (
  rawFile: File,
  silentInvalid = false,
  uploadFile?: any,
) => {
  const isValid = isValidFile(rawFile);
  if (!isValid) {
    if (!silentInvalid) {
      ElMessage.warning(`文件 ${rawFile.name} 不是支持的类型，已跳过`);
    }
    if (uploadFile) {
      uploadRef.value?.handleRemove(uploadFile);
    }
    return;
  }

  const exists = fileList.value.some((f) => {
    const currentPath = (f as any).webkitRelativePath;
    const nextPath = (rawFile as any).webkitRelativePath;
    if (uploadMode.value === "folder" && currentPath && nextPath) {
      return currentPath === nextPath;
    }
    return f.name === rawFile.name && f.size === rawFile.size;
  });

  if (!exists) {
    fileList.value.push(rawFile);
  }
};

// 文件变化处理
const handleFileChange = (file: any) => {
  const rawFile = file.raw;
  if (rawFile) {
    pushRawFile(rawFile, false, file);
  }
};

const triggerFolderSelect = () => {
  folderInputRef.value?.click();
};

const handleFolderInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  files.forEach((file) => pushRawFile(file, true));

  if (files.length > 0) {
    ElMessage.success(`已选择 ${fileList.value.length} 个可处理文件`);
  }
  input.value = "";
};

// 文件移除处理
const handleFileRemove = (file: any) => {
  const rawFile = file.raw;
  if (rawFile) {
    const index = fileList.value.findIndex(
      (f) => f.name === rawFile.name && f.size === rawFile.size,
    );
    if (index > -1) {
      fileList.value.splice(index, 1);
    }
  }
};

const removeFolderFile = (target: File) => {
  const targetPath = (target as any).webkitRelativePath;
  const index = fileList.value.findIndex((f) => {
    const currentPath = (f as any).webkitRelativePath;
    if (targetPath && currentPath) {
      return currentPath === targetPath;
    }
    return f.name === target.name && f.size === target.size;
  });
  if (index > -1) {
    fileList.value.splice(index, 1);
  }
};

// 从文件中提取中文文本
const extractChineseFromFile = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // 去除注释
        const withoutComments = content.replace(commentRegex, "");
        // 提取所有匹配的中文
        const chineseMatches = [...withoutComments.matchAll(chineseRegex)];

        const result: string[] = [];

        chineseMatches.forEach((match) => {
          if (!match.index) return;
          let startIndex = match.index;
          let endIndex = match.index + match[0].length;

          // 向前查找，直到找到单引号、双引号、模板字符串或 >，对于 .js 文件，也要查找大括号和逗号
          while (startIndex > 0) {
            const char = withoutComments[startIndex - 1];
            if (
              char === "'" ||
              char === '"' ||
              char === "`" ||
              char === ">" ||
              (file.name.endsWith(".js") && (char === "{" || char === ","))
            ) {
              break;
            }
            startIndex--;
          }

          // 向后查找，直到找到单引号、双引号、模板字符串或 <，对于 .js 文件，找到冒号时停止
          while (endIndex < withoutComments.length) {
            const char = withoutComments[endIndex];
            if (
              char === "'" ||
              char === '"' ||
              char === "`" ||
              char === "<" ||
              (file.name.endsWith(".js") && char === ":")
            ) {
              break;
            }
            endIndex++;
          }

          // 截取前后匹配到的字符串，并去掉前后的换行符
          const fullMatch = withoutComments.slice(startIndex, endIndex).trim();
          result.push(fullMatch.replace(/\n/g, ""));
        });

        // 去重
        const uniqueResult = [...new Set(result)];
        resolve(uniqueResult);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
};

// 开始提取
const handleExtract = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning("请先上传文件");
    return;
  }

  extracting.value = true;
  extractResult.value = [];
  dedupeResult.value = [];
  hasDedupeChecked.value = false;

  try {
    const results: FileData[] = [];

    for (const file of fileList.value) {
      try {
        const texts = await extractChineseFromFile(file);
        results.push({
          fileName: file.name,
          texts: texts,
          textCount: texts.length,
        });
      } catch (error) {
        console.error(`提取文件 ${file.name} 失败:`, error);
        ElMessage.error(`提取文件 ${file.name} 失败`);
      }
    }

    extractResult.value = results;
    ElMessage.success(
      `提取完成！共处理 ${results.length} 个文件，提取 ${totalTextCount.value} 条文本`,
    );
  } catch (error) {
    console.error("提取失败:", error);
    ElMessage.error("提取失败");
  } finally {
    extracting.value = false;
  }
};

const openExtractDetail = (rowIndex: number) => {
  const target = extractResult.value[rowIndex];
  if (!target) {
    ElMessage.warning("未找到对应提取记录");
    return;
  }
  currentDetailRowIndex.value = rowIndex;
  detailTexts.value = [...target.texts];
  extractDetailDialogVisible.value = true;
};

const handleDeleteDetailText = (textIndex: number) => {
  detailTexts.value.splice(textIndex, 1);
};

const handleSaveDetailTexts = () => {
  const target = currentDetailFile.value;
  if (!target) {
    ElMessage.warning("未找到对应提取记录");
    return;
  }
  const cleanedTexts = detailTexts.value
    .map((item) => item.trim())
    .filter(Boolean);
  target.texts = cleanedTexts;
  target.textCount = cleanedTexts.length;
  dedupeResult.value = [];
  hasDedupeChecked.value = false;
  extractDetailDialogVisible.value = false;
  ElMessage.success("提取内容已更新");
};

const goToStep2 = () => {
  if (extractResult.value.length === 0) {
    ElMessage.warning("请先完成提取");
    return;
  }
  currentStep.value = 1;
};

const goToStep1 = () => {
  currentStep.value = 0;
};

const goToStep3 = () => {
  if (dedupeResult.value.length === 0) {
    ElMessage.warning("请先完成去重校验");
    return;
  }
  currentStep.value = 2;
};

// 导出Excel
const handleExportExcel = () => {
  if (extractResult.value.length === 0) {
    ElMessage.warning("没有可导出的数据");
    return;
  }

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // 多列输出，每个文件对应一列
    const headers = extractResult.value.map((data) => data.fileName);
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

    // 找出最大行数
    const maxRowCount = Math.max(
      ...extractResult.value.map((data) => data.texts.length),
    );

    // 将每个文件的提取内容按列写入，补齐空行
    extractResult.value.forEach((data, colIndex) => {
      for (let rowIndex = 0; rowIndex < maxRowCount; rowIndex++) {
        const text = data.texts[rowIndex] || "";
        XLSX.utils.sheet_add_aoa(ws, [[text]], {
          origin: { r: rowIndex + 1, c: colIndex },
        });
      }
    });

    // 设置列宽度
    const colWidths = extractResult.value.map(() => ({ wch: 20 }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Chinese Text");

    // 生成文件名：中文文本提取_yyyyMMddHHmmss.xlsx
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate(),
    )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `中文文本提取_${timestamp}.xlsx`;
    XLSX.writeFile(wb, fileName);

    ElMessage.success("Excel文件导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出Excel失败");
  }
};

// 第二步：去重校验
const handleDedupe = async () => {
  if (step1Texts.value.length === 0) {
    ElMessage.warning("请先完成第一步：提取中文文本");
    return;
  }

  deduping.value = true;
  hasDedupeChecked.value = false;
  dedupeResult.value = [];

  try {
    // 1. 自我校验：统计每个文本出现的次数
    const textCountMap = new Map<string, number>();
    step1Texts.value.forEach((text) => {
      textCountMap.set(text, (textCountMap.get(text) || 0) + 1);
    });

    // 2. 与数据库对比：批量查询数据库中的翻译项
    const dbTexts = new Set<string>();
    const uniqueTextsArray = Array.from(uniqueTexts.value);

    // 显示进度提示
    if (uniqueTextsArray.length > 0) {
      ElMessage.info(
        `正在与数据库对比，共 ${uniqueTextsArray.length} 条文本...`,
      );
    }

    // 分批查询数据库（避免一次性查询过多）
    const batchSize = 20; // 减小批次大小，避免请求过多
    let processedCount = 0;

    for (let i = 0; i < uniqueTextsArray.length; i += batchSize) {
      const batch = uniqueTextsArray.slice(i, i + batchSize);

      // 并行查询批次中的文本
      const batchPromises = batch.map(async (text) => {
        try {
          const response = await http.get("/api/search", {
            page: 1,
            pageSize: 1,
            searchSelect: "zh-CN",
            searchContent: text,
            exactMatch: true, // 精确匹配
          });

          if (
            response.data?.status === 200 &&
            response.data.data?.data?.length > 0
          ) {
            return text;
          }
          return null;
        } catch (error) {
          console.error(`查询文本 "${text}" 失败:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((text) => {
        if (text) {
          dbTexts.add(text);
        }
      });

      processedCount += batch.length;
      // 每处理一批，更新进度（可选，避免消息过多）
      if (processedCount % 50 === 0) {
        console.log(
          `已处理 ${processedCount}/${uniqueTextsArray.length} 条文本`,
        );
      }
    }

    // 3. 构建结果
    const results: DedupeResult[] = uniqueTextsArray.map((text) => {
      const count = textCountMap.get(text) || 1;
      const isDuplicate = count > 1; // 在提取结果中重复
      const dbMatch = dbTexts.has(text); // 在数据库中已存在

      return {
        text,
        isDuplicate,
        dbMatch,
        count,
      };
    });

    // 按状态排序：新增的在前，重复的在后
    results.sort((a, b) => {
      if (a.isDuplicate || a.dbMatch) return 1;
      if (b.isDuplicate || b.dbMatch) return -1;
      return 0;
    });

    dedupeResult.value = results;
    hasDedupeChecked.value = true;

    ElMessage.success(
      `去重完成！共 ${uniqueTextsArray.length} 条文本，新增 ${newTextCount.value} 条，重复 ${duplicateTextCount.value} 条`,
    );
  } catch (error) {
    console.error("去重失败:", error);
    ElMessage.error("去重失败");
  } finally {
    deduping.value = false;
  }
};

// 导出去重结果
const handleExportDedupeResult = () => {
  if (dedupeResult.value.length === 0) {
    ElMessage.warning("没有可导出的数据");
    return;
  }

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // 表头
    const headers = ["中文文本", "状态", "数据库匹配", "出现次数"];
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

    // 数据
    const data = dedupeResult.value.map((item) => [
      item.text,
      item.isDuplicate ? "重复" : "新增",
      item.dbMatch ? "已存在" : "不存在",
      item.count,
    ]);
    XLSX.utils.sheet_add_aoa(ws, data, { origin: "A2" });

    // 设置列宽度
    ws["!cols"] = [
      { wch: 40 }, // 中文文本
      { wch: 10 }, // 状态
      { wch: 12 }, // 数据库匹配
      { wch: 10 }, // 出现次数
    ];

    XLSX.utils.book_append_sheet(wb, ws, "去重结果");

    // 生成文件名
    const fileName = `中文文本去重结果_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    ElMessage.success("Excel文件导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出Excel失败");
  }
};

// 第三步：AI翻译
const handleTranslate = async () => {
  if (textsToTranslate.value.length === 0) {
    ElMessage.warning("请先完成第二步：中文文本去重");
    return;
  }

  hasTranslateExecuted.value = true;
  hasImportExecuted.value = false;
  translating.value = true;
  translateResult.value = [];
  importSummary.value = null;
  translateProgress.value = 0;
  currentTranslateIndex.value = 0;

  try {
    const results: TranslateResult[] = [];
    const total = textsToTranslate.value.length;

    for (let i = 0; i < total; i++) {
      const text = textsToTranslate.value[i];
      currentTranslateIndex.value = i;

      try {
        // 构建翻译提示词
        const prompt = `请将以下中文文本翻译成英文和繁体中文。请严格按照以下JSON格式返回结果，不要添加任何其他内容：
{
  "en-US": "英文翻译",
  "zh-HK": "繁体中文翻译"
}

需要翻译的文本：${text}`;

        // 调用AI接口
        const response = await callBailianAPI(prompt);

        // 尝试解析JSON格式的响应
        let translationResult: { "en-US"?: string; "zh-HK"?: string } = {};

        try {
          // 尝试直接解析JSON
          translationResult = JSON.parse(response);
        } catch (e) {
          // 如果直接解析失败，尝试提取JSON部分
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            translationResult = JSON.parse(jsonMatch[0]);
          } else {
            // 如果无法解析JSON，尝试从文本中提取
            const enMatch =
              response.match(/["']en-US["']\s*:\s*["']([^"']+)["']/i) ||
              response.match(/en-US[：:]\s*([^\n]+)/i);
            const zhHKMatch =
              response.match(/["']zh-HK["']\s*:\s*["']([^"']+)["']/i) ||
              response.match(/zh-HK[：:]\s*([^\n]+)/i);

            if (enMatch) {
              translationResult["en-US"] = enMatch[1].trim();
            }
            if (zhHKMatch) {
              translationResult["zh-HK"] = zhHKMatch[1].trim();
            }
          }
        }

        // 构建结果
        results.push({
          source: text,
          target: {
            "en-US": translationResult["en-US"] || "",
            "zh-HK": translationResult["zh-HK"] || "",
          },
          error: !translationResult["en-US"] && !translationResult["zh-HK"],
          imported: false,
        });
      } catch (error: any) {
        console.error(`翻译文本 "${text}" 失败:`, error);
        results.push({
          source: text,
          target: {
            "en-US": "",
            "zh-HK": "",
          },
          error: true,
          imported: false,
        });
      }

      // 更新进度
      translateProgress.value = Math.round(((i + 1) / total) * 100);
    }

    translateResult.value = results;

    const successCount = results.filter((r) => !r.error).length;
    const failCount = results.filter((r) => r.error).length;

    ElMessage.success(
      `翻译完成！成功 ${successCount} 条，失败 ${failCount} 条`,
    );
  } catch (error) {
    console.error("翻译失败:", error);
    ElMessage.error("翻译失败");
  } finally {
    translating.value = false;
    translateProgress.value = 100;
  }
};

// 导出翻译结果
const handleExportTranslateResult = () => {
  if (translateResult.value.length === 0) {
    ElMessage.warning("没有可导出的数据");
    return;
  }

  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // 表头
    const headers = ["翻译项", "翻译项-英文", "翻译项-繁体"];
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

    // 数据（只导出成功的翻译）
    const data = translateResult.value
      .filter((item) => !item.error)
      .map((item) => [item.source, item.target["en-US"], item.target["zh-HK"]]);
    XLSX.utils.sheet_add_aoa(ws, data, { origin: "A2" });

    // 设置列宽度
    ws["!cols"] = [
      { wch: 40 }, // 翻译项
      { wch: 40 }, // 翻译项-英文
      { wch: 40 }, // 翻译项-繁体
    ];

    XLSX.utils.book_append_sheet(wb, ws, "翻译结果");

    // 生成文件名
    const fileName = `AI翻译结果_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    ElMessage.success("Excel文件导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出Excel失败");
  }
};

const handleImportTranslateToDB = async () => {
  const successItems = translateResult.value.filter(
    (item) => !item.error && !item.imported
  );
  if (successItems.length === 0) {
    ElMessage.warning("没有待导入的数据");
    return;
  }

  hasImportExecuted.value = true;
  importingToDb.value = true;
  importSummary.value = null;
  try {
    let successCount = 0;
    const failItems: Array<{ source: string; reason: string }> = [];

    // 串行导入，避免后端按“当前最大ID+1”生成ID时产生并发冲突
    for (const item of successItems) {
      try {
        await http.post("/api/addBing", {
          source: item.source,
          target: {
            "zh-CN": item.source,
            "en-US": item.target["en-US"] || "",
            "zh-HK": item.target["zh-HK"] || "",
          },
          projectCode: [],
        });
        item.imported = true;
        successCount++;
      } catch (error: any) {
        const reason =
          error?.response?.data?.message ||
          error?.message ||
          "请求失败";
        failItems.push({
          source: item.source || "--",
          reason,
        });
      }
    }

    const totalCount = successItems.length;
    const failCount = failItems.length;

    const message =
      failCount === 0
        ? `导入成功，共 ${successCount} 条`
        : `导入完成，共 ${totalCount} 条，成功 ${successCount} 条，失败 ${failCount} 条`;

    importSummary.value = {
      totalCount,
      successCount,
      failCount,
      message,
      failItems,
    };

    if (failCount === 0) {
      ElMessage.success(message);
      return;
    }
    ElMessage.warning(message);
  } catch (error) {
    console.error("导入数据库失败:", error);
    importSummary.value = {
      totalCount: successItems.length,
      successCount: 0,
      failCount: successItems.length,
      message: "导入数据库失败，请稍后重试",
      failItems: successItems.map((item) => ({
        source: item.source,
        reason: "请求异常",
      })),
    };
    ElMessage.error("导入数据库失败");
  } finally {
    importingToDb.value = false;
  }
};

const openTranslateEditDialog = (rowIndex: number) => {
  const target = translateResult.value[rowIndex];
  if (!target) {
    ElMessage.warning("未找到对应翻译项");
    return;
  }
  currentEditTranslateIndex.value = rowIndex;
  translateEditForm.value = {
    source: target.source || "",
    enUS: target.target["en-US"] || "",
    zhHK: target.target["zh-HK"] || "",
  };
  translateEditDialogVisible.value = true;
};

const handleSaveTranslateEdit = () => {
  const rowIndex = currentEditTranslateIndex.value;
  const target = translateResult.value[rowIndex];
  if (!target) {
    ElMessage.warning("未找到对应翻译项");
    return;
  }

  const source = translateEditForm.value.source.trim();
  const enUS = translateEditForm.value.enUS.trim();
  const zhHK = translateEditForm.value.zhHK.trim();

  if (!source) {
    ElMessage.warning("翻译项不能为空");
    return;
  }

  target.source = source;
  target.target["en-US"] = enUS;
  target.target["zh-HK"] = zhHK;
  target.error = !enUS && !zhHK;
  target.imported = false;
  hasImportExecuted.value = false;
  importSummary.value = null;

  translateEditDialogVisible.value = false;
  ElMessage.success("翻译项已更新");
};

const handleDeleteTranslateItem = (rowIndex: number) => {
  const target = translateResult.value[rowIndex];
  if (!target) {
    ElMessage.warning("未找到对应翻译项");
    return;
  }
  translateResult.value.splice(rowIndex, 1);
  hasImportExecuted.value = false;
  importSummary.value = null;
  ElMessage.success("翻译项已删除");
};

const resetTranslationAutomation = () => {
  currentStep.value = 0;
  fileList.value = [];
  uploadRef.value?.clearFiles?.();
  if (folderInputRef.value) {
    folderInputRef.value.value = "";
  }
  extractResult.value = [];
  dedupeResult.value = [];
  hasDedupeChecked.value = false;
  translateResult.value = [];
  hasTranslateExecuted.value = false;
  hasImportExecuted.value = false;
  importSummary.value = null;
  translateProgress.value = 0;
  currentTranslateIndex.value = 0;
  currentDetailRowIndex.value = -1;
  detailTexts.value = [];
  translateEditDialogVisible.value = false;
  currentEditTranslateIndex.value = -1;
  translateEditForm.value = {
    source: "",
    enUS: "",
    zhHK: "",
  };
  ElMessage.success("已返回翻译项自动化初始状态");
};
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.translation-auto-content {
  min-height: 400px;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 500px;
}

.steps-header {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.steps-content {
  flex: 1;
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 4px;
}

.step-panel {
  height: 100%;
}

.step-panel h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.step-content {
  min-height: 400px;
}

.upload-section {
  margin-bottom: 20px;
}

/* 统一文件上传与文件夹上传区域视觉风格 */
.upload-demo :deep(.el-upload-dragger),
.folder-upload-box {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  padding: 28px 16px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.upload-demo :deep(.el-upload:hover .el-upload-dragger),
.folder-upload-box:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.upload-demo :deep(.el-icon--upload),
.folder-upload-box .el-icon--upload {
  font-size: 56px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 10px;
}

.upload-demo :deep(.el-upload__text),
.folder-upload-box .el-upload__text {
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.upload-demo :deep(.el-upload__tip),
.folder-upload-box .el-upload__tip {
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.folder-input-hidden {
  display: none;
}

.folder-file-list {
  margin-top: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: #fff;
}

.folder-file-list__header {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.folder-file-list__body {
  max-height: 180px;
  overflow-y: auto;
}

.folder-file-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 12px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.folder-file-list__item:last-child {
  border-bottom: none;
}

.folder-file-list__name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-actions {
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.result-section {
  margin-top: 30px;
}

.result-header {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

.text-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.more-text {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.detail-file-name {
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}

.dedupe-section {
  margin-bottom: 20px;
}

.dedupe-info {
  margin-bottom: 20px;
}

.info-stats {
  display: flex;
  gap: 40px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.dedupe-actions {
  display: flex;
  align-items: center;
}

/* .result-stats {
  display: flex;
  align-items: center;
} */

.translate-section {
  margin-bottom: 20px;
}

.translate-info {
  margin-bottom: 20px;
}

.translate-actions {
  display: flex;
  align-items: center;
}

.progress-section {
  margin: 20px 0;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.progress-text {
  margin-top: 10px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.import-result-section {
  margin-top: 12px;
}

.all-imported-alert {
  margin-top: 12px;
}

.celebrate-gif-like {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 20px;
}

.confetti-item {
  display: inline-block;
  animation: confettiBounce 1s ease-in-out infinite;
}

.confetti-item:nth-child(2) {
  animation-delay: 0.1s;
}

.confetti-item:nth-child(3) {
  animation-delay: 0.2s;
}

.confetti-item:nth-child(4) {
  animation-delay: 0.3s;
}

.confetti-item:nth-child(5) {
  animation-delay: 0.4s;
}

@keyframes confettiBounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-6px) scale(1.15);
    opacity: 1;
  }
}

.error-text {
  color: #f56c6c;
}
</style>
