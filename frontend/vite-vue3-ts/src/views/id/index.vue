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
      <el-table-column label="翻译项">
        <template #default="scope">
          <el-tag>{{ scope.row.target[`zh-CN`] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.$index, scope.row)"
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
    <AddId v-model="dialogVisible" @submit="handleSubmitSuccess"/>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import AddId from "@/views/id/components/addId.vue";
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

const dialogVisible = ref(false);
interface User {
  id: string;
  target: {
    [key: string]: string;
  };
  status: string;
}

let tableData = ref<User[]>([]); // 默认值[];
const getData = () => {
  axios
    .get("http://localhost:3000/api/getBingList", {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      tableData.value = res.data.data;
      total.value = res.data.data.length;
    });
};

const showDialog = () => {
  dialogVisible.value = true;
};

const handleDelete = (index: number, row: User) => {
  console.log(index, row);
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
