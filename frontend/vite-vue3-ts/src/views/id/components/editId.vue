<template>
    <el-dialog
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      title="编辑翻译项"
      width="30%"
      :close-on-click-modal="false"
    >
      <el-form :model="localEditItem">
        <el-form-item label="中文翻译">
          <el-input v-model="localEditItem.target['zh-CN']" />
        </el-form-item>
        <el-form-item label="英文翻译">
          <el-input v-model="localEditItem.target['en-US']" />
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
  
  interface Translation {
    id: string
    target: Record<string, string>
    status: string
  }
  
  // 基于类型的 Props 声明
  const props = defineProps<{
    modelValue: boolean
    currentEditItem: Translation
  }>()
  
  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'update:currentEditItem', value: Translation): void
    (e: 'submit', value: Translation): void
  }>()
  
  // 本地数据副本（使用结构化克隆）
  const localEditItem = ref<Translation>(JSON.parse(JSON.stringify(props.currentEditItem)))
  
  // 同步 v-model 状态
  watch(() => props.modelValue, (val) => {
    if (val === false) {
      resetForm()
    }
  })
  
  const handleCancel = () => {
    emit('update:modelValue', false)
    emit('update:currentEditItem', props.currentEditItem)
  }
  
  const handleSubmit = () => {
    emit('submit', localEditItem.value)
    emit('update:currentEditItem', localEditItem.value)
    emit('update:modelValue', false)
  }
  
  const resetForm = () => {
    localEditItem.value = structuredClone(props.currentEditItem)
  }
  </script>