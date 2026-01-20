<template>
  <div class="container">
    <div class="api-content">
      <!-- 操作按钮组 -->
      <div style="margin-bottom: 20px">
        <el-button type="primary" :icon="Plus" @click="handleAdd" disabled>
          新增配置
        </el-button>
      </div>

      <!-- 配置列表 -->
      <el-table :data="apiConfigList" stripe style="width: 100%">
        <el-table-column prop="name" label="配置名称" width="150" />
        <el-table-column prop="apiKey" label="API Key" min-width="200">
          <template #default="scope">
            <el-input
              v-model="scope.row.apiKey"
              type="password"
              show-password
              readonly
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="apiUrl" label="API URL" min-width="250" />
        <el-table-column prop="modelName" label="模型名称" width="150" />
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <div style="display: flex; gap: 8px">
              <el-button
                size="small"
                type="warning"
                disabled
                @click="handleEdit(scope.row, scope.$index)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                disabled
                @click="handleDelete(scope.$index)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑配置' : '新增配置'"
      width="500px"
      :z-index="2000"
      :append-to-body="true"
      :close-on-click-modal="false"
      @close="handleCloseDialog"
    >
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="配置名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入配置名称"
          />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="formData.apiKey"
            type="password"
            show-password
            placeholder="请输入API Key"
          />
        </el-form-item>
        <el-form-item label="API URL" prop="apiUrl">
          <el-input
            v-model="formData.apiUrl"
            placeholder="请输入API URL"
          />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-select
            v-model="formData.modelName"
            placeholder="请选择模型"
            style="width: 100%"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.value"
              :label="model.label"
              :value="model.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  BAILIAN_API_KEY,
  BAILIAN_API_URL,
  MODEL_NAME,
  AVAILABLE_MODELS,
} from "@/utils/bailianAPI";

interface ApiConfig {
  name: string;
  apiKey: string;
  apiUrl: string;
  modelName: string;
}

const apiConfigList = ref<ApiConfig[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editIndex = ref(-1);
const formRef = ref<FormInstance>();

const formData = reactive<ApiConfig>({
  name: "",
  apiKey: "",
  apiUrl: "",
  modelName: "",
});

const availableModels = AVAILABLE_MODELS;

const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  apiKey: [{ required: true, message: "请输入API Key", trigger: "blur" }],
  apiUrl: [{ required: true, message: "请输入API URL", trigger: "blur" }],
  modelName: [
    { required: true, message: "请选择模型名称", trigger: "change" },
  ],
});

// 初始化：从 bailianAPI.ts 读取默认配置
onMounted(() => {
  // 从 localStorage 读取保存的配置
  const savedConfigs = localStorage.getItem("ai-api-configs");
  if (savedConfigs) {
    try {
      apiConfigList.value = JSON.parse(savedConfigs);
    } catch (error) {
      console.error("读取配置失败:", error);
      initDefaultConfig();
    }
  } else {
    initDefaultConfig();
  }
});

// 初始化默认配置
const initDefaultConfig = () => {
  apiConfigList.value = [
    {
      name: "默认配置",
      apiKey: BAILIAN_API_KEY,
      apiUrl: BAILIAN_API_URL,
      modelName: MODEL_NAME,
    },
  ];
  saveConfigs();
};

// 保存配置到 localStorage
const saveConfigs = () => {
  localStorage.setItem("ai-api-configs", JSON.stringify(apiConfigList.value));
};

// 新增配置
const handleAdd = () => {
  isEdit.value = false;
  editIndex.value = -1;
  formData.name = "";
  formData.apiKey = "";
  formData.apiUrl = "";
  formData.modelName = "";
  dialogVisible.value = true;
};

// 编辑配置
const handleEdit = (row: ApiConfig, index: number) => {
  isEdit.value = true;
  editIndex.value = index;
  formData.name = row.name;
  formData.apiKey = row.apiKey;
  formData.apiUrl = row.apiUrl;
  formData.modelName = row.modelName;
  dialogVisible.value = true;
};

// 删除配置
const handleDelete = async (index: number) => {
  try {
    await ElMessageBox.confirm("确定要删除该配置吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    apiConfigList.value.splice(index, 1);
    saveConfigs();
    ElMessage.success("删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

// 关闭对话框
const handleCloseDialog = () => {
  dialogVisible.value = false;
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    if (isEdit.value && editIndex.value >= 0) {
      // 编辑
      apiConfigList.value[editIndex.value] = { ...formData };
      ElMessage.success("编辑成功");
    } else {
      // 新增
      apiConfigList.value.push({ ...formData });
      ElMessage.success("新增成功");
    }
    saveConfigs();
    handleCloseDialog();
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.api-content {
  min-height: 400px;
}
</style>
