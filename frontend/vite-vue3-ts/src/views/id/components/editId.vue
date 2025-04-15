<template>
  <el-dialog
    :model-value="modelValue"
    @close="handleCancel"
    title="编辑翻译项"
    width="30%"
    :close-on-click-modal="false"
  >
    <el-form
      :model="localEditItem"
      ref="formRef"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="翻译项ID" prop="id">
        <el-input
          v-model="localEditItem.id"
          placeholder="请生成翻译项ID"
          clearable
          disabled
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
      <el-form-item label="翻译项" prop="source">
        <el-input
          v-model="localEditItem.target['zh-CN']"
          placeholder="请输入翻译项"
          style="flex: 1; margin-right: 70px"
          clearable
        />
      </el-form-item>
      <!-- <el-form-item label="翻译项-中文" prop="target['zh-CN']">
        <el-input
          v-model="localEditItem.target['zh-CN']"
          placeholder="请输入翻译项-中文"
          style="flex: 1; margin-right: 70px"
          clearable
        />
      </el-form-item> -->
      <el-form-item label="翻译项-英文" prop="target['en-US']">
        <el-input
          v-model="localEditItem.target['en-US']"
          placeholder="请输入翻译项-英文"
          clearable
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
      <el-form-item label="翻译项-繁体" prop="target['zh-HK']">
        <el-input
          v-model="localEditItem.target['zh-HK']"
          placeholder="请输入翻译项-繁体"
          clearable
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";

interface Translation {
  id: string;
  target: Record<string, string>;
  status: string;
}

// 基于类型的 Props 声明
const props = defineProps<{
  modelValue: boolean;
  currentEditItem: Translation;
}>();


const emit = defineEmits<{
  (e: "update:model-value", value: boolean): void;
  (e: "submit", value: Translation): void;
}>();

// 本地数据副本
const localEditItem = ref<Translation>(
  JSON.parse(JSON.stringify(props.currentEditItem))
);

// 初始化后数据隔离
// 仅在组件初始化时复制一次父级数据，后续父级数据变化不会自动更新
watch(
  () => props.currentEditItem,
  (newVal) => {
    localEditItem.value = JSON.parse(JSON.stringify(newVal));
  },
  { deep: true }
);

// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => {
    console.log('props.modelValue',val)
  }
);

const handleCancel = () => {
  emit("update:model-value", false);
};

const handleSubmit = () => {
  axios
      .put("http://localhost:3000/api/updateBing", {
        id: localEditItem.value.id,
        source: localEditItem.value.target['zh-CN'],
        target: localEditItem.value.target,
      })
      .then(
        () => {
          ElMessage.success("编辑成功");
          emit("update:model-value", false);
          emit("submit", localEditItem.value);
        },
        () => {
          ElMessage.error("编辑失败");
        }
      );
  
};
</script>
