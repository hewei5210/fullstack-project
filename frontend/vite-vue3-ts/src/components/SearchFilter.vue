<template>
  <div class="search-filter">
    <el-form :model="formData" inline>
      <el-form-item label="登录账号">
        <el-input
          v-model="formData.loginAccount"
          placeholder="请输入登录账号"
          clearable
          style="width: 200px"
        />
      </el-form-item>
      
      <el-form-item label="登录方式">
        <el-select
          v-model="formData.loginMethod"
          placeholder="请选择登录方式"
          clearable
          style="width: 150px"
        >
          <el-option label="账号密码" value="password" />
          <el-option label="手机号验证码" value="sms" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="版本号">
        <el-input
          v-model="formData.version"
          placeholder="请输入版本号"
          clearable
          style="width: 150px"
        />
      </el-form-item>
      
      <el-form-item label="版本类型">
        <el-input
          v-model="formData.versionType"
          placeholder="请输入版本类型"
          clearable
          style="width: 150px"
        />
      </el-form-item>
      
      <el-form-item label="时间选择">
        <el-date-picker
          v-model="formData.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 350px"
        />
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

interface FormData {
  loginAccount: string
  loginMethod: string
  version: string
  versionType: string
  timeRange: [string, string] | null
}

const formData = reactive<FormData>({
  loginAccount: '',
  loginMethod: '',
  version: '',
  versionType: '',
  timeRange: null
})

const emit = defineEmits<{
  search: [data: FormData]
  reset: []
}>()

const handleSearch = () => {
  emit('search', { ...formData })
}

const handleReset = () => {
  Object.assign(formData, {
    loginAccount: '',
    loginMethod: '',
    version: '',
    versionType: '',
    timeRange: null
  })
  emit('reset')
}
</script>

<style scoped>
.search-filter {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.el-form {
  margin: 0;
}

.el-form-item {
  margin-bottom: 0;
  margin-right: 20px;
}

.el-form-item:last-child {
  margin-right: 0;
}

.el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
