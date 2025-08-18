<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用前端工具平台</span>
        </div>
      </template>
      <div class="welcome-content">
        <h2>🎉 欢迎回来！</h2>
        <p>这是一个功能强大的前端工具平台，提供多种实用工具和服务。</p>
        
        <!-- Token状态检查区域 -->
        <el-card class="token-status-card" v-if="showTokenStatus">
          <template #header>
            <div class="card-header">
              <span>Token状态检查</span>
              <el-button size="small" @click="checkTokenStatus">刷新状态</el-button>
            </div>
          </template>
          <div class="token-info">
            <p><strong>状态:</strong> {{ tokenStatus.status }}</p>
            <p><strong>描述:</strong> {{ tokenStatus.message }}</p>
            <p><strong>Token:</strong> {{ tokenInfo.token ? '存在' : '不存在' }}</p>
            <p><strong>RefreshToken:</strong> {{ tokenInfo.refreshToken ? '存在' : '不存在' }}</p>
            <p><strong>用户信息:</strong> {{ tokenInfo.user ? '存在' : '不存在' }}</p>
            <el-button type="primary" @click="refreshToken" :loading="refreshing">
              手动刷新Token
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import tokenManager from '@/utils/tokenManager';
import { ElMessage } from 'element-plus';

const showTokenStatus = ref(false);
const tokenStatus = ref({ status: '', message: '' });
const tokenInfo = ref({});
const refreshing = ref(false);

const checkTokenStatus = () => {
  tokenStatus.value = tokenManager.getTokenStatus();
  tokenInfo.value = {
    token: !!tokenManager.getToken(),
    refreshToken: !!tokenManager.getRefreshToken(),
    user: !!tokenManager.getUser()
  };
};

const refreshToken = async () => {
  refreshing.value = true;
  try {
    await tokenManager.refreshToken();
    ElMessage.success('Token刷新成功');
    checkTokenStatus();
  } catch (error) {
    ElMessage.error('Token刷新失败: ' + error.message);
  } finally {
    refreshing.value = false;
  }
};

onMounted(() => {
  // 开发环境下显示token状态检查
  if (import.meta.env.DEV) {
    showTokenStatus.value = true;
    checkTokenStatus();
  }
});
</script>

<style scoped>
.home-container {
  padding: 20px;
}

.welcome-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-content {
  text-align: center;
}

.welcome-content h2 {
  color: #409eff;
  margin-bottom: 20px;
}

.welcome-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.token-status-card {
  margin-top: 20px;
  text-align: left;
}

.token-info p {
  margin: 10px 0;
  font-size: 14px;
}

.token-info .el-button {
  margin-top: 15px;
}
</style>
