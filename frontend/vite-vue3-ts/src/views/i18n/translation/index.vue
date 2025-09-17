<template>
  <div class="container">
    <!-- 操作按钮组 -->
    <div class="action-bar">
      <div class="action-buttons">
        <!-- 数据操作按钮组 -->
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
            :icon="Edit" 
            @click="batchUpdateDialog"
            title="批量修改现有翻译项"
          >
            批量修改
          </el-button>
          <el-button 
            type="danger" 
            :icon="Delete" 
            @click="batchDeleteDialog"
            title="批量删除翻译项"
          >
            批量删除
          </el-button>
          <el-button 
            type="info" 
            :icon="Search" 
            @click="batchGetIdsDialog"
            title="批量获取翻译项ID"
          >
            批量获取ID
          </el-button>
        </el-button-group>

        <!-- 导出按钮组 -->
        <el-button-group class="button-group">
          <el-button 
            type="success" 
            :icon="Download" 
            @click="exportDialog"
            title="导出为JSON格式"
          >
            导出JSON
          </el-button>
          <el-button 
            type="info" 
            :icon="Download" 
            @click="exportExcelDialog"
            title="导出为Excel格式"
          >
            导出EXCEL
          </el-button>
        </el-button-group>
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
            <el-button :icon="Search" @click="searchData" />
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
      <el-table-column label="操作" width="180">
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
    <ExportDialog v-model="exportDialogVisible" />
    <ExportExcelDialog v-model="exportExcelDialogVisible" />
  </div>
</template>

<script lang="ts" setup>
import { http } from "../../../net/http";
import { ref, onMounted, defineAsyncComponent } from "vue";
const AddId = defineAsyncComponent(() => import("./components/addItem.vue"));
const AddBatchId = defineAsyncComponent(() => import("./components/addBatchItems.vue"));
const UpdateBatchId = defineAsyncComponent(() => import("./components/updateBatchId.vue"));
const GetBatchIds = defineAsyncComponent(() => import("./components/getBatchIds.vue"));
const DeleteBatchId = defineAsyncComponent(() => import("./components/deleteBatchItems.vue"));
const EditId = defineAsyncComponent(() => import("./components/editItem.vue"));
const DeleteId = defineAsyncComponent(() => import("./components/deleteItem.vue"));
const ExportDialog = defineAsyncComponent(() => import("./components/exportDialog.vue"));
const ExportExcelDialog = defineAsyncComponent(() => import("./components/exportExcelDialog.vue"));
import { Plus, Download, Upload, Search, Edit, Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 分页
import type { ComponentSize } from "element-plus";
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
  status: string;
}

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

const searchData = () => {
  const params = {
    page: currentPage.value,
    pageSize: pageSize.value,
    searchSelect: select.value,
    searchContent: searchContent.value,
  };
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
// 获取列表数据
let tableData = ref<Translation[]>([]); // 默认值[];
const getData = () => {
  if (searchContent.value) {
    searchData();
    return;
  }
  const params = {
    page: currentPage.value,
    pageSize: pageSize.value,
  };
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
  getData(); // 页面加载时自动触发
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
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.button-group {
  display: flex;
  flex-shrink: 0;
}

.search-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 280px;
}

.search-input {
  width: 350px;
  min-width: 280px;
}

.search-select {
  width: 130px;
  min-width: 100px;
}

/* 按钮组样式优化 */
:deep(.el-button-group .el-button) {
  border-radius: 0;
}

:deep(.el-button-group .el-button:first-child) {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

:deep(.el-button-group .el-button:last-child) {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
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
    width: 320px;
    min-width: 260px;
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
  
  .search-area {
    width: 100%;
    align-self: stretch;
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
}

.copyable-cell:hover {
  background-color: rgba(114, 96, 211, 0.08);
  border-color: rgba(114, 96, 211, 0.2);
  color: #7260d3;
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
