<template>
    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="visible"
      title="删除确认"
      width="25%"
      :close-on-click-modal="false"
    >
      <span>确定要删除 {{ currentDeleteItem?.id }} 吗？</span>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="danger" :loading="deleteLoading" @click="confirmDelete">
          确认
        </el-button>
      </template>
    </el-dialog>
  </template>
  
  <script lang="ts" setup>
  import { http } from "../../../../net/http";
  import { ref, watch } from "vue";
  import { ElMessage } from "element-plus";
  
  interface Translation {
    id: string;
    target: Record<string, string>;
    status: string;
  }
  
  const props = defineProps<{
    modelValue: boolean;
    currentDeleteItem: Translation | null;
  }>();
  
  const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "submit"): void;
  }>();
  
  const visible = ref(props.modelValue);
  const deleteLoading = ref(false);
  
  // 同步 v-model 状态
  watch(
    () => props.modelValue,
    (val) => {
      visible.value = val;
    }
  );
  
  // 同步弹窗状态到父组件
  watch(visible, (val) => emit("update:modelValue", val));
  
  const confirmDelete = async () => {
    if (!props.currentDeleteItem) return;
    
    try {
      deleteLoading.value = true;
      const params = { id: props.currentDeleteItem.id };
      await http.delete(`/api/delBing`, params);
      ElMessage.success("删除成功");
      visible.value = false;
      emit("submit");
    } catch (error) {
      ElMessage.error("删除失败");
    } finally {
      deleteLoading.value = false;
    }
  };
  </script>