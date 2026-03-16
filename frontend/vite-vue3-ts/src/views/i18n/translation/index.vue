<template>
  <div class="container">
    <!-- 操作按钮组 -->
    <div class="action-bar">
      <div class="action-buttons">
        <!-- 主要操作按钮组 -->
        <el-button-group class="button-group">
          <el-button 
            type="primary" 
            :icon="Plus" 
            @click="showDialog"
            title="添加单个翻译项"
          >
            新增翻译项
          </el-button>
          <el-button 
            type="success" 
            :icon="Upload" 
            @click="batchDialog"
            title="批量导入翻译项"
          >
            批量新增
          </el-button>
          <el-button 
            type="warning" 
            :icon="Download" 
            @click="exportDialog"
            title="导出为JSON格式"
          >
            导出JSON
          </el-button>
        </el-button-group>


        <!-- 更多功能下拉菜单 -->
        <el-dropdown trigger="click" class="more-dropdown">
          <el-button type="info" :icon="MoreFilled">
            更多功能
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="batchUpdateDialog">
                <el-icon style="margin-right: 8px;"><Edit /></el-icon>
                <span>批量修改</span>
              </el-dropdown-item>
              <el-dropdown-item @click="batchDeleteDialog" divided>
                <el-icon style="margin-right: 8px;"><Delete /></el-icon>
                <span>批量删除</span>
              </el-dropdown-item>
              <el-dropdown-item @click="batchGetIdsDialog">
                <el-icon style="margin-right: 8px;"><Search /></el-icon>
                <span>批量获取ID</span>
              </el-dropdown-item>
              <el-dropdown-item @click="exportExcelDialog" divided>
                <el-icon style="margin-right: 8px;"><Download /></el-icon>
                <span>导出EXCEL</span>
              </el-dropdown-item>
              <el-dropdown-item @click="excelToJsonDialog">
                <el-icon style="margin-right: 8px;"><Upload /></el-icon>
                <span>Excel转JSON</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 所属项目筛选（多选） -->
      <div class="project-filter">
        <el-select
          v-model="selectedProjectCodes"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="所属项目"
          class="project-select"
          clearable
          @change="onProjectFilterChange"
        >
          <el-option
            v-for="item in PROJECT_TAGS"
            :key="item.projectCode"
            :label="item.label"
            :value="item.projectCode"
          />
        </el-select>
      </div>
      <!-- 搜索区域 -->
      <div class="search-area">
        <el-input
          v-model="searchContent"
          class="search-input"
          :placeholder="placeholderMap[select]"
          clearable
          @clear="handleClearSearch"
          @keyup.enter="searchData"
        >
          <template #prepend>
            <el-select v-model="select" class="search-select">
              <el-option label="翻译项ID" value="id" />
              <el-option label="翻译项" value="zh-CN" />
              <el-option label="翻译项-英文" value="en-US" />
              <el-option label="翻译项-繁体" value="zh-HK" />
            </el-select>
          </template>
          <template #append>
            <div class="search-append-wrapper">
              <el-select 
                v-model="searchMode" 
                class="search-mode-select"
                @change="handleSearchModeChange"
              >
                <el-option label="模糊搜索" value="fuzzy" />
                <el-option label="精确搜索" value="exact" />
              </el-select>
              <el-button :icon="Search" @click="searchData" title="搜索" type="primary" class="search-submit-btn" />
            </div>
          </template>
        </el-input>
      </div>
    </div>
    <!-- 列表 -->
    <el-table :data="tableData" stripe style="width: 100%">
      <el-table-column label="翻译项ID" width="160" fixed="left">
        <template #default="scope">
          <div 
            class="copyable-cell"
            @dblclick="copyToClipboard(scope.row.id, '翻译项ID')"
            title="双击复制"
          >
            <span>{{ scope.row.id }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="翻译项" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <div 
            class="copyable-cell"
            @dblclick="copyToClipboard(scope.row.target['zh-CN'], '翻译项')"
            title="双击复制"
          >
            {{ scope.row.target[`zh-CN`] }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="翻译项-英文" min-width="250" show-overflow-tooltip>
        <template #default="scope">
          <div 
            class="copyable-cell"
            @dblclick="copyToClipboard(scope.row.target['en-US'], '翻译项-英文')"
            title="双击复制"
          >
            {{ scope.row.target[`en-US`] }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="翻译项-繁体" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          <div 
            class="copyable-cell"
            @dblclick="copyToClipboard(scope.row.target['zh-HK'], '翻译项-繁体')"
            title="双击复制"
          >
            {{ scope.row.target[`zh-HK`] }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="所属项目" min-width="140" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ formatProjectCodes(scope.row.projectCode) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            type="warning"
            @click="showEditDialog(scope.row)"
            style="margin-right: 8px"
          >
            编辑
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="showDeleteConfirm(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="float: right; margin: 15px 0"
    />
    <AddId v-model="dialogVisible" @submit="handleSubmitSuccess" />
    <AddBatchId v-model="batchDialogVisible" @submit="handleSubmitSuccess" />
    <UpdateBatchId v-model="batchUpdateDialogVisible" @submit="handleSubmitSuccess" />
    <GetBatchIds v-model="batchGetIdsDialogVisible" @submit="handleSubmitSuccess" />
    <DeleteBatchId
      v-model="batchDeleteDialogVisible"
      @submit="handleSubmitSuccess"
    />
    <EditId
      v-model="editDialogVisible"
      :current-edit-item="currentEditItem"
      @submit="handleSubmitSuccess"
    />
    <DeleteId
      v-model="deleteDialogVisible"
      :current-delete-item="currentDeleteItem"
      @submit="handleSubmitSuccess"
    />
    <ExportDialog v-model="exportDialogVisible" :selected-project-codes="selectedProjectCodes" />
    <ExportExcelDialog v-model="exportExcelDialogVisible" :selected-project-codes="selectedProjectCodes" />
    <ExcelToJsonDialog v-model="excelToJsonDialogVisible" />
  </div>
</template>

<script lang="ts" setup>
import { http } from "../../../net/http";
import { ref, computed, onMounted, defineAsyncComponent } from "vue";
const AddId = defineAsyncComponent(() => import("./components/addItem.vue"));
const AddBatchId = defineAsyncComponent(() => import("./components/addBatchItems.vue"));
const UpdateBatchId = defineAsyncComponent(() => import("./components/updateBatchId.vue"));
const GetBatchIds = defineAsyncComponent(() => import("./components/getBatchIds.vue"));
const DeleteBatchId = defineAsyncComponent(() => import("./components/deleteBatchItems.vue"));
const EditId = defineAsyncComponent(() => import("./components/editItem.vue"));
const DeleteId = defineAsyncComponent(() => import("./components/deleteItem.vue"));
const ExportDialog = defineAsyncComponent(() => import("./components/exportDialog.vue"));
const ExportExcelDialog = defineAsyncComponent(() => import("./components/exportExcelDialog.vue"));
const ExcelToJsonDialog = defineAsyncComponent(() => import("./components/excelToJsonDialog.vue"));
import { Plus, Download, Upload, Search, Edit, Delete, MoreFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 分页
import type { ComponentSize } from "element-plus/es";
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const size = ref<ComponentSize>("default");
const background = ref(false);
const disabled = ref(false);

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getData();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getData();
};

interface Translation {
  id: string;
  target: {
    [key: string]: string;
  };
  projectCode?: string[];
  status: string;
}

// 所属项目选项（静态数据，与新增/编辑弹窗和后端保持一致）
const PROJECT_TAGS = [
  { label: "云管", projectCode: "cda_cem_client" },
  { label: "工作台", projectCode: "cem-quality-protal" },
  { label: "二级管", projectCode: "cutt_rpmp_porta" },
  { label: "订购页", projectCode: "cloud_computer_client" },
  { label: "控制台", projectCode: "computer_entconsole_client" },
  { label: "企业门户", projectCode: "ccemp-web" },
] as const;

// 项目筛选
const selectedProjectCodes = ref<string[]>([]);

const onProjectFilterChange = () => {
  currentPage.value = 1;
  getData();
};

// 将 projectCode 数组格式化为展示文案（优先显示 label）
const formatProjectCodes = (codes?: string[]) => {
  if (!codes || codes.length === 0) return "所有项目";
  return codes
    .map((code) => PROJECT_TAGS.find((t) => t.projectCode === code)?.label || code)
    .join("、");
};

// 搜索相关
type PlaceholderKey = "id" | "zh-CN" | "en-US" | "zh-HK";
const placeholderMap: Record<PlaceholderKey, string> = {
  id: "请输入翻译项ID",
  "zh-CN": "请输入翻译项",
  "en-US": "请输入翻译项-英文",
  "zh-HK": "请输入翻译项-繁体",
};

const select = ref<PlaceholderKey>("zh-CN");
const searchContent = ref("");
const searchMode = ref<"fuzzy" | "exact">("fuzzy"); // 搜索模式：fuzzy-模糊搜索，exact-精确搜索

// 根据搜索模式计算 exactMatch
const exactMatch = computed(() => searchMode.value === "exact");

const searchData = () => {
  // 精准搜索时不需要转义，模糊搜索时需要转义特殊字符
  const escapedSearchContent = exactMatch.value 
    ? searchContent.value 
    : searchContent.value.replace(/\$/g, '\\$');
  
  const params: Record<string, unknown> = {
    page: currentPage.value,
    pageSize: pageSize.value,
    searchSelect: select.value,
    searchContent: escapedSearchContent,
    exactMatch: exactMatch.value,
  };
  if (selectedProjectCodes.value.length > 0) {
    params.projectCodes = selectedProjectCodes.value;
  }
  http.get("/api/search", params).then((res) => {
    if (res.data.status === 200) {
      tableData.value = res.data.data.data;
      total.value = res.data.data.total;
    } else {
      console.error('搜索失败:', res.data.message);
    }
  }).catch((error) => {
    console.error('搜索请求失败:', error);
  });
};

// 搜索模式变化时的处理
const handleSearchModeChange = () => {
  // 如果当前有搜索内容，自动重新搜索
  if (searchContent.value) {
    searchData();
  }
};
// 获取列表数据
let tableData = ref<Translation[]>([]); // 默认值[];
const getData = () => {
  if (searchContent.value) {
    searchData();
    return;
  }
  const params: Record<string, unknown> = {
    page: currentPage.value,
    pageSize: pageSize.value,
  };
  if (selectedProjectCodes.value.length > 0) {
    params.projectCodes = selectedProjectCodes.value;
  }
  http.get("/api/getBingList", params).then((res) => {
    if (res.data.status === 200) {
      tableData.value = res.data.data.data;
      total.value = res.data.data.total;
    } else {
      console.error('获取数据失败:', res.data.message);
    }
  }).catch((error) => {
    console.error('获取数据请求失败:', error);
  });
};

// 控制新增翻译项弹窗
const dialogVisible = ref(false);
const showDialog = () => {
  dialogVisible.value = true;
};

const batchDialogVisible = ref(false);
// 控制批量新增弹窗
const batchDialog = () => {
  batchDialogVisible.value = true;
};
// 控制批量修改弹窗
const batchUpdateDialogVisible = ref(false);
const batchUpdateDialog = () => {
  batchUpdateDialogVisible.value = true;
};
// 控制导出数据弹窗
const exportDialogVisible = ref(false);
const exportDialog = () => {
  exportDialogVisible.value = true;
};

// 控制导出EXCEL弹窗
const exportExcelDialogVisible = ref(false);
const exportExcelDialog = () => {
  exportExcelDialogVisible.value = true;
};

// 控制Excel转JSON弹窗
const excelToJsonDialogVisible = ref(false);
const excelToJsonDialog = () => {
  excelToJsonDialogVisible.value = true;
};

// 批量获取ID弹窗
const batchGetIdsDialogVisible = ref(false);
const batchGetIdsDialog = () => {
  batchGetIdsDialogVisible.value = true;
};

// 批量删除弹窗
const batchDeleteDialogVisible = ref(false);
const batchDeleteDialog = () => {
  batchDeleteDialogVisible.value = true;
};

// 编辑相关状态
const editDialogVisible = ref(false); // 新增编辑相关状态
const currentEditItem = ref<Translation>({
  id: "",
  target: { "zh-CN": "", "en-US": "", "zh-HK": "" },
  projectCode: [],
  status: "",
});
const showEditDialog = (row: Translation) => {
  editDialogVisible.value = true;
  currentEditItem.value = JSON.parse(JSON.stringify(row)); // 深拷贝当前行数据
};

// 删除相关状态
const deleteDialogVisible = ref(false);

const currentDeleteItem = ref<Translation | null>(null);
// 修改删除处理逻辑
const showDeleteConfirm = (row: Translation) => {
  currentDeleteItem.value = row;
  deleteDialogVisible.value = true;
};

// 在父组件脚本中添加处理函数
const handleSubmitSuccess = () => {
  getData(); // 调用现有的数据获取方法
  // ElMessage.success("列表已刷新");
};

const handleClearSearch = () => {
  searchContent.value = "";
  getData(); // 清空后自动刷新数据
};

// 复制到剪贴板功能
const copyToClipboard = async (text: string, type: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`${type}已复制到剪贴板`);
  } catch (error) {
    ElMessage.error('复制失败，请手动复制');
  }
};

onMounted(() => {
  getData();
});
</script>
<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 650px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 16px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.button-group {
  display: flex;
  flex-shrink: 0;
}

.project-filter {
  flex-shrink: 0;
}
.project-select {
  width: 220px;
  min-width: 180px;
}

.search-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 420px;
}

.search-input {
  width: 420px;
  min-width: 420px;
}

.search-select {
  width: 130px;
  min-width: 100px;
}

/* 搜索附加区域包装器 */
.search-append-wrapper {
  display: flex;
  align-items: stretch;
  height: 100%;
}

/* 搜索模式下拉框样式 */
.search-mode-select {
  min-width: 100px;
  flex-shrink: 0;
}

/* 确保下拉框和按钮正确排列 */
:deep(.el-input-group__append) {
  display: flex;
  align-items: stretch;
  padding: 0;
  border: none;
}

:deep(.search-mode-select) {
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  margin: 0;
}

:deep(.search-mode-select .el-input__wrapper) {
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  height: 100%;
}

:deep(.search-mode-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.search-submit-btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
  margin: 0;
  flex-shrink: 0;
}

/* 按钮组样式优化 */
:deep(.el-button-group .el-button) {
  border-radius: 0;
}

:deep(.el-button-group .el-button:first-child) {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

/* 更多功能按钮右侧圆角 */
:deep(.more-dropdown .el-button) {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

:deep(.el-button-group .el-button:last-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

/* 更多功能下拉菜单样式 */
.more-dropdown {
  margin-left: 0;
}

:deep(.more-dropdown .el-button) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  padding: 10px 20px;
}

/* 搜索框样式优化 */
:deep(.el-input-group__prepend) {
  background-color: #f8fafc;
  border-color: #d1d5db;
}

:deep(.el-select .el-input__inner) {
  border: none;
  background: transparent;
}

/* 响应式设计 - 中等屏幕 */
@media (max-width: 1200px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .action-buttons {
    justify-content: flex-start;
    gap: 8px;
  }
  
  .search-area {
    align-self: flex-end;
    min-width: auto;
  }
  
  .search-input {
    width: 400px;
    min-width: 350px;
  }
  
  .search-area {
    min-width: 430px;
  }
}

/* 响应式设计 - 小屏幕 */
@media (max-width: 768px) {
  .action-bar {
    padding: 12px;
    gap: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
  }
  
  .button-group {
    width: 100%;
  }

  :deep(.el-button-group) {
    display: flex;
    width: 100%;
  }

  :deep(.el-button-group .el-button) {
    flex: 1;
    border-radius: 6px !important;
    margin: 0 2px;
  }

  :deep(.el-button-group .el-button:first-child) {
    margin-left: 0;
  }

  :deep(.el-button-group .el-button:last-child) {
    margin-right: 0;
  }

  .more-dropdown {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }

  :deep(.more-dropdown .el-button) {
    width: 100%;
  }
  
  .search-area {
    width: 100%;
    align-self: stretch;
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100% !important;
    min-width: auto;
  }
  
  .search-select {
    width: 120px;
    min-width: 100px;
  }
}

/* 响应式设计 - 超小屏幕 */
@media (max-width: 480px) {
  .container {
    margin: 5px;
    padding: 15px;
  }
  
  .action-bar {
    padding: 10px;
    gap: 12px;
  }
  
  .search-select {
    width: 100px;
    min-width: 80px;
  }
  
  :deep(.el-button-group .el-button) {
    font-size: 12px;
    padding: 8px 12px;
  }
}

/* 平滑过渡效果 */
.action-bar,
.action-buttons,
.search-area {
  transition: all 0.3s ease;
}

/* 双击复制功能样式 */
.copyable-cell {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  border: 1px solid transparent;
  user-select: none; /* 禁用文本选择 */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE/Edge */
}

.copyable-cell:hover {
  background-color: rgba(114, 96, 211, 0.08);
  border-color: rgba(114, 96, 211, 0.2);
}

.copyable-cell:active {
  background-color: rgba(114, 96, 211, 0.12);
  transform: scale(0.98);
}

/* 复制提示动画 */
@keyframes copySuccess {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}

.copy-success {
  animation: copySuccess 0.6s ease-in-out;
}
</style>
