<template>
  <div class="container">
    <div class="header">
      <el-button @click="goBack">返回</el-button>
      <div class="meta">
        <span>用户：{{ detail.username || "--" }}</span>
        <span>操作类型：{{ detail.operationType || "--" }}</span>
        <span>操作时间：{{ formatTime(detail.createdAt) }}</span>
      </div>
    </div>

    <el-table :data="detail.detailItems" stripe style="width: 100%">
      <el-table-column prop="translationId" label="翻译项ID" min-width="160" />
      <el-table-column prop="source" label="翻译项" min-width="260" />
      <el-table-column prop="enUS" label="翻译项-英文" min-width="260" />
      <el-table-column prop="zhHK" label="翻译项-繁体" min-width="260" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { http } from "@/net/http";

interface DetailItem {
  translationId: string;
  source: string;
  enUS: string;
  zhHK: string;
}

const route = useRoute();
const router = useRouter();

const detail = reactive<{
  username: string;
  operationType: string;
  createdAt: string;
  detailItems: DetailItem[];
}>({
  username: "",
  operationType: "",
  createdAt: "",
  detailItems: [],
});

const fetchDetail = async () => {
  const id = route.params.id as string;
  const res: any = await http.get(`/api/operation-logs/${id}`);
  if (res?.data?.status === 200) {
    detail.username = res.data.data.username || "";
    detail.operationType = res.data.data.operationType || "";
    detail.createdAt = res.data.data.createdAt || "";
    detail.detailItems = res.data.data.detailItems || [];
  }
};

const goBack = () => {
  router.push("/console/operation-log");
};

const formatTime = (time: string) => {
  if (!time) return "--";
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("zh-CN", { hour12: false });
};

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #606266;
  flex-wrap: wrap;
}
</style>
