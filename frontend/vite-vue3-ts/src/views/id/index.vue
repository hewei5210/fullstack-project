<template>
  <div style="margin: 20px 20px 0 20px">
    <!-- 新增按钮 -->
    <el-button
      type="primary"
      :icon="Plus"
      @click="showDialog"
      style="margin-bottom: 20px"
      >新增翻译项</el-button
    >
    <!-- 列表 -->
    <el-table :data="displayData" stripe style="width: 100%">
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
    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除确认"
      width="25%"
      :close-on-click-modal="false"
    >
      <span>确定要删除 {{ currentDeleteItem?.id }} 吗？</span>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="deleteLoading"
          @click="confirmDelete"
        >
          确认
        </el-button>
      </template>
    </el-dialog>
    <AddId v-model="dialogVisible" @submit="handleSubmitSuccess" />
    <EditId
      v-model="editDialogVisible"
      :current-edit-item="currentEditItem"
      @submit="handleSubmitSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import AddId from "./components/addId.vue";
import EditId from "./components/editId.vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus"; // Import ElMessage as a value
import axios from "axios";

// 分页
import type { ComponentSize } from "element-plus";
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const size = ref<ComponentSize>("default");
const background = ref(false);
const disabled = ref(false);

// 显示数据的计算属性
const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start, end);
});
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1; // 切换每页条数时重置到第一页
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

interface Translation {
  id: string;
  target: {
    [key: string]: string;
  };
  status: string;
}

// 获取列表数据
let tableData = ref<Translation[]>([]); // 默认值[];
const getData = () => {
  axios
    .get("http://localhost:3000/api/getBingList", {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      console.log("res", res.data.data);
      tableData.value = res.data.data;
      total.value = res.data.data.length;
    });
};

// 控制新增翻译项弹窗
const dialogVisible = ref(false);
const showDialog = () => {
  dialogVisible.value = true;
};

// 编辑相关状态
const editDialogVisible = ref(false); // 新增编辑相关状态
const currentEditItem = ref<Translation>({
  id: "",
  target: { "zh-CN": "", "en-US": "", "zh-HK": "" },
  status: "",
});
const showEditDialog = (row: Translation) => {
  currentEditItem.value = JSON.parse(JSON.stringify(row)); // 深拷贝当前行数据
  editDialogVisible.value = true;
};

// 删除相关状态
const deleteDialogVisible = ref(false);
const deleteLoading = ref(false);
const currentDeleteItem = ref<Translation | null>(null);
// 修改删除处理逻辑
const showDeleteConfirm = (row: Translation) => {
  currentDeleteItem.value = row;
  deleteDialogVisible.value = true;
};
const confirmDelete = async () => {
  if (!currentDeleteItem.value) return;
  try {
    deleteLoading.value = true;
    // 调用删除接口
    await axios.delete("http://localhost:3000/api/delBing", {
      data: { id: currentDeleteItem.value.id },
      headers: { "Content-Type": "application/json" },
    });
    // 更新本地数据（两种方案任选其一）
    // 方案1：直接过滤
    tableData.value = tableData.value.filter(
      (item) => item.id !== currentDeleteItem.value?.id
    );
    total.value -= 1;
    // 方案2：重新加载数据
    // await getData();
    ElMessage.success("删除成功");
    deleteDialogVisible.value = false;
    // 分页校正
    if (displayData.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
  } catch (error) {
    ElMessage.error("删除失败");
    console.error("删除失败:", error);
  } finally {
    deleteLoading.value = false;
    currentDeleteItem.value = null;
  }
};

// 在父组件脚本中添加处理函数
const handleSubmitSuccess = () => {
  getData(); // 调用现有的数据获取方法
  ElMessage.success("数据添加成功，列表已刷新");
};

onMounted(() => {
  getData(); // 页面加载时自动触发
});
</script>
<style scoped></style>
