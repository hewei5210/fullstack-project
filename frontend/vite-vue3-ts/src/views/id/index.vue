<template>
  <div style="margin: 20px 20px 0 20px;">
    <!-- 新增按钮 -->
    <el-button type="primary" :icon="Plus" @click="showDialog" style="margin-bottom: 20px;"
      >新增翻译项</el-button
    >
    <!-- 列表 -->
    <el-table :data="tableData" style="width: 100%">
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
    <AddId v-model="dialogVisible" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import AddId from "@/views/id/components/addId.vue";
import { Plus } from "@element-plus/icons-vue";

const dialogVisible = ref(false);
interface User {
  id: string;
  item: string;
}
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
</script>
<style scoped>
/* 背景色与间距 */
::v-deep .el-table {
  background-color: #f5f7fa !important;
  border-radius: 8px;
}
/* 行悬停效果 */
::v-deep .el-table__body tr:hover > td {
  background-color: #e8f4ff !important;
}
/* 调整行高与间距 */
::v-deep .el-table__cell {
  padding: 12px 0;
}
::v-deep .el-table__body {
  -webkit-border-vertical-spacing: 10px;
}
</style>