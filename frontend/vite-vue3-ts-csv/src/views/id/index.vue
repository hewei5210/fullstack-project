<template>
  <div style="margin: 20px 20px 0 20px">
    <!-- 操作按钮组 -->
    <div style="margin-bottom: 20px">
      <el-button type="primary" :icon="Plus" @click="showDialog"
        >新增翻译项</el-button
      >
      <el-button
        type="warning"
        :icon="Upload"
        @click="batchDialog"
        style="margin-left: 10px"
      >
        批量新增
      </el-button>
      <el-button
        type="success"
        :icon="Download"
        @click="exportDialog"
        style="margin-left: 10px"
        >导出数据</el-button
      >
      <el-input
        v-model="searchContent"
        style="max-width: 350px; margin-left: 10px"
        :placeholder="placeholderMap[select]"
      >
        <template #prepend>
          <el-select v-model="select" style="width: 130px">
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
    <!-- 列表 -->
    <el-table :data="tableData" stripe style="width: 100%">
      <el-table-column label="翻译项ID" width="150">
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <span style="margin-left: 10px">{{ scope.row.id }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="翻译项" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.target[`zh-CN`] }}
        </template>
      </el-table-column>
      <el-table-column label="翻译项-英文" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.target[`en-US`] }}
        </template>
      </el-table-column>
      <el-table-column label="翻译项-繁体" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.target[`zh-HK`] }}
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
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
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
  </div>
</template>

<script lang="ts" setup>
import { http } from "../../net/http.ts";
import { ref, onMounted } from "vue";
import AddId from "./components/addId.vue";
import AddBatchId from "./components/addBatchId.vue";
import EditId from "./components/editId.vue";
import DeleteId from "./components/deleteId.vue";
import ExportDialog from "./components/exportDialog.vue";
import { Plus, Download, Upload, Search } from "@element-plus/icons-vue";
// import { ElMessage } from "element-plus";

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
    tableData.value = res.data.data.data;
    total.value = res.data.data.total;
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
    tableData.value = res.data.data.data;
    total.value = res.data.data.total;
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
// 控制导出数据弹窗
const exportDialogVisible = ref(false);
const exportDialog = () => {
  exportDialogVisible.value = true;
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

onMounted(() => {
  getData(); // 页面加载时自动触发
});
</script>
<style scoped></style>
