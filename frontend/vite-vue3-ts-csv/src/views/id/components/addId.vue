<template>
  <el-dialog
    v-model="visible"
    title="新增翻译项"
    width="30%"
    @close="handleClose"
  >
    <el-form
      :model="formData"
      :rules="rules"
      ref="formRef"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="翻译项ID" prop="id">
        <div class="inline-container">
          <el-input
            v-model="formData.id"
            placeholder="请生成翻译项ID"
            style="flex: 1; margin-right: 12px"
            clearable
            disabled
          />
          <el-button
            type="primary"
            link
            plain
            size="small"
            @click="generateId"
            :icon="RefreshRight"
          >
            生成ID
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="翻译项" prop="source">
        <el-input
          v-model="formData.source"
          placeholder="请输入翻译项"
          style="flex: 1; margin-right: 70px"
          clearable
        />
      </el-form-item>
      <!-- <el-form-item label="翻译项-中文" prop="target['zh-CN']">
        <el-input
          v-model="formData.target['zh-CN']"
          placeholder="请输入翻译项-中文"
          style="flex: 1; margin-right: 70px"
          clearable
        />
      </el-form-item> -->
      <el-form-item label="翻译项-英文" prop="target['en-US']">
        <el-input
          v-model="formData.target['en-US']"
          placeholder="请输入翻译项-英文"
          clearable
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
      <el-form-item label="翻译项-繁体" prop="target['zh-HK']">
        <el-input
          v-model="formData.target['zh-HK']"
          placeholder="请输入翻译项-繁体"
          clearable
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { http } from "../..//../net/http.ts";
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus"; // Import ElMessage as a value
import type { FormInstance, FormRules } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";

interface TranslationItem {
  id: string;
  source: string;
  target: {
    "zh-CN": string;
    "en-US": string;
    "zh-HK": string;
  };
}

const props = defineProps<{
  modelValue: boolean;
  initialData?: TranslationItem;
}>();

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref<FormInstance>();
const visible = ref(props.modelValue);
// 初始化表单数据
const formData = reactive<TranslationItem>({
  id: props.initialData?.id || "",
  source: props.initialData?.source || "",
  target: {
    "zh-CN": props.initialData?.target["zh-CN"] || "",
    "en-US": props.initialData?.target["en-US"] || "",
    "zh-HK": props.initialData?.target["zh-HK"] || "",
  },
});

const rules = reactive<FormRules>({
  id: [{ required: true, message: "ID不能为空", trigger: "blur" }],
  source: [{ required: true, message: "翻译项不能为空", trigger: "blur" }],
});

// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => (visible.value = val)
);
watch(visible, (val) => emit("update:modelValue", val));

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    http
      .post("/api/addBing", {
        id: formData.id,
        source: formData.source,
        target: formData.target,
      })
      .then(
        () => {
          ElMessage.success("添加成功");
          emit("submit", formData);
          visible.value = false;
        },
        () => {
          ElMessage.error("添加失败");
        }
      );
  } catch (error) {
    console.log("表单验证失败:", error);
  }
};

const handleClose = () => {
  formRef.value?.resetFields();
};

const generateId = () => {
  http.get("/api/applyId").then((res) => {
    formData.id = res.data.data;
  });
};
</script>
<style scoped>
.inline-container {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>
