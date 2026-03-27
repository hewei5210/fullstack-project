<template>
  <div class="container">
    <div class="filter-bar">
      <el-input
        v-model="filters.username"
        placeholder="按用户筛选"
        clearable
        class="filter-item user-filter"
      />
      <el-select
        v-model="filters.operationType"
        placeholder="按操作类型筛选"
        clearable
        class="filter-item type-filter"
      >
        <el-option
          v-for="item in operationTypeOptions"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
      <el-date-picker
        v-model="filters.timeRange"
        type="datetimerange"
        value-format="YYYY-MM-DD HH:mm:ss"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        class="filter-item date-filter"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="tableData" stripe style="width: 100%">
      <el-table-column prop="username" label="用户" min-width="140" />
      <el-table-column prop="operationType" label="操作类型" min-width="180" />
      <el-table-column label="操作详情" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="goDetail(scope.row.id)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="操作时间" min-width="180">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pagination"
      :current-page="pagination.page"
      :page-size="pagination.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { http } from "@/net/http";

interface OperationLogRow {
  id: string;
  username: string;
  operationType: string;
  createdAt: string;
}

const operationTypeOptions = [
  "新增翻译项",
  "批量新增翻译项",
  "编辑翻译项",
  "批量编辑翻译项",
  "删除翻译项",
  "批量删除翻译项",
];

const router = useRouter();
const tableData = ref<OperationLogRow[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const filters = reactive<{
  username: string;
  operationType: string;
  timeRange: string[];
}>({
  username: "",
  operationType: "",
  timeRange: [],
});

const fetchData = async () => {
  const params: Record<string, any> = {
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
  if (filters.username.trim()) {
    params.username = filters.username.trim();
  }
  if (filters.operationType) {
    params.operationType = filters.operationType;
  }
  if (filters.timeRange?.length === 2) {
    params.startTime = filters.timeRange[0];
    params.endTime = filters.timeRange[1];
  }

  const res: any = await http.get("/api/operation-logs", params);
  if (res?.data?.status === 200) {
    tableData.value = res.data.data.data || [];
    pagination.total = res.data.data.total || 0;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

const handleReset = () => {
  filters.username = "";
  filters.operationType = "";
  filters.timeRange = [];
  pagination.page = 1;
  fetchData();
};

const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  pagination.page = 1;
  fetchData();
};

const handlePageChange = (val: number) => {
  pagination.page = val;
  fetchData();
};

const goDetail = (id: string) => {
  router.push(`/console/operation-log/${id}`);
};

const formatTime = (time: string) => {
  if (!time) return "--";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("zh-CN", { hour12: false });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-item {
  min-width: 180px;
}

.user-filter {
  width: 200px;
}

.type-filter {
  width: 220px;
}

.date-filter {
  width: 420px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
