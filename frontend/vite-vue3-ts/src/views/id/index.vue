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
    <el-table :data="tableData" stripe style="width: 100%">
      <el-table-column label="翻译项ID">
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <span style="margin-left: 10px">{{ scope.row.id }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="翻译项">
        <template #default="scope">
          <el-tag>{{ scope.row.item }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
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
      v-model:current-page="currentPage4"
      v-model:page-size="pageSize4"
      :page-sizes="[100, 200, 300, 400]"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="400"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      style="float: right; margin: 15px 0"
    />
    <AddId v-model="dialogVisible" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import AddId from "@/views/id/components/addId.vue";
import { Plus } from "@element-plus/icons-vue";
import axios from "axios";

// 分页
import type { ComponentSize } from "element-plus";
const currentPage4 = ref(4);
const pageSize4 = ref(100);
const size = ref<ComponentSize>("default");
const background = ref(false);
const disabled = ref(false);
const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};

const dialogVisible = ref(false);
interface User {
  id: string;
  item: string;
}
const getData = () => {
  axios.get("http://localhost:3000/api/getBingList",{
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    console.log(res);
  });
};

const tableData: User[] = [
  {
    id: "2016-05-03",
    item: "Tom",
  },
  {
    id: "2016-05-02",
    item: "Tom",
  },
  {
    id: "2016-05-04",
    item: "Tom",
  },
  {
    id: "2016-05-01",
    item: "Tom",
  },
];
const showDialog = () => {
  dialogVisible.value = true;
};

const handleDelete = (index: number, row: User) => {
  console.log(index, row);
};

onMounted(() => {
  getData(); // 页面加载时自动触发
});
</script>
<style scoped></style>
