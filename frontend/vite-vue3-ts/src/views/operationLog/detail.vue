<template>
  <div class="container">
    <div class="header">
      <div class="meta">
        <el-tag type="info" effect="light" round>
          用户：{{ detail.username || "--" }}
        </el-tag>
        <el-tag type="primary" effect="light" round>
          操作类型：{{ detail.operationType || "--" }}
        </el-tag>
        <el-tag type="success" effect="light" round>
          操作时间：{{ formatTime(detail.createdAt) }}
        </el-tag>
      </div>
    </div>

    <el-table :data="detail.detailItems" stripe style="width: 100%">
      <el-table-column prop="translationId" label="翻译项ID" min-width="160" />
      <el-table-column
        v-if="isEditOperationLog"
        prop="prevSource"
        label="原翻译项"
        min-width="220"
      />
      <el-table-column
        v-if="isEditOperationLog"
        prop="prevEnUS"
        label="原翻译项-英文"
        min-width="220"
      />
      <el-table-column
        v-if="isEditOperationLog"
        prop="prevZhHK"
        label="原翻译项-繁体"
        min-width="220"
      />
      <el-table-column
        v-if="isEditOperationLog"
        label="原所属项目"
        min-width="160"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          {{ formatProjectCodes(row.prevProjectCode) }}
        </template>
      </el-table-column>
      <el-table-column prop="source" label="翻译项" min-width="220" />
      <el-table-column prop="enUS" label="翻译项-英文" min-width="220" />
      <el-table-column prop="zhHK" label="翻译项-繁体" min-width="220" />
      <el-table-column label="所属项目" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ formatProjectCodes(row.projectCode) }}
        </template>
      </el-table-column>
    </el-table>

    <div class="footer-actions">
      <el-button @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { http } from "@/net/http";

interface DetailItem {
  translationId: string;
  prevSource?: string;
  prevEnUS?: string;
  prevZhHK?: string;
  prevProjectCode?: string[];
  source: string;
  enUS: string;
  zhHK: string;
  projectCode?: string[];
}

// 与翻译管理页一致，用于所属项目展示
const PROJECT_TAGS = [
  { label: "云管", projectCode: "cda_cem_client" },
  { label: "工作台", projectCode: "cem-quality-protal" },
  { label: "二级管", projectCode: "cutt_rpmp_porta" },
  { label: "订购页", projectCode: "cloud_computer_client" },
  { label: "控制台", projectCode: "computer_entconsole_client" },
  { label: "企业门户", projectCode: "ccemp-web" },
] as const;

const formatProjectCodes = (codes?: string[]) => {
  if (!codes || codes.length === 0) return "所有项目";
  return codes
    .map(
      (code) =>
        PROJECT_TAGS.find((t) => t.projectCode === code)?.label || code
    )
    .join("、");
};

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

/** 编辑类（含单条编辑、批量修改、批量打标签）展示变更前后字段 */
const isEditOperationLog = computed(() =>
  (detail.operationType || "").includes("编辑")
);

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
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 16px;
}

.footer-actions {
  margin-top: auto;
  padding-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
