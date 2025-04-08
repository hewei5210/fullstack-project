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
      <el-form-item label="翻译项-中文" prop="item">
        <el-input
          v-model="formData.item"
          placeholder="请输入翻译项-中文"
          style="flex: 1; margin-right: 70px"
          clearable
        />
      </el-form-item>
      <el-form-item label="翻译项-英文" prop="item-en">
        <el-input
          v-model="formData.item"
          placeholder="请输入翻译项-英文"
          clearable
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
      <el-form-item label="翻译项-繁体" prop="item-tw">
        <el-input
          v-model="formData.item"
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
import { ref, reactive, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import axios from "axios";

const props = defineProps<{
  modelValue: boolean;
  initialData?: { id: string; item: string };
}>();

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref<FormInstance>();
const visible = ref(props.modelValue);
const formData = reactive({
  id: props.initialData?.id || "",
  item: props.initialData?.item || "",
});

const rules = reactive<FormRules>({
  id: [
    { required: true, message: "ID不能为空", trigger: "blur" },
  ],
  item: [{ required: true, message: "翻译内容不能为空", trigger: "blur" }],
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
    emit("submit", { ...formData });
    visible.value = false;
  } catch (error) {
    console.log("表单验证失败:", error);
  }
};

const handleClose = () => {
  formRef.value?.resetFields();
};

const generateId = () => {
  axios
    .get("http://localhost:3000/api/applyId", {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      console.log('res',res.data)
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
