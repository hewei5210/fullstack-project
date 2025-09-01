<template>
  <div class="login-container">
    <img
      src="../../public/partying_face_color.svg"
      class="login-image"
      alt="logo"
    />
    <el-form label-width="auto" @submit.prevent="handleLogin">
      <h2>前端工具平台</h2>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入密码"
        />
      </el-form-item>
      <el-button 
        type="primary" 
        native-type="submit"
        :loading="isLoading"
        :disabled="isLoading"
      >
        {{ isLoading ? '登录中...' : '登录' }}
      </el-button>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { http } from "@/net/http";
import tokenManager from "@/utils/tokenManager";
import { ElMessage } from "element-plus";

const router = useRouter();
const form = reactive({ username: "", password: "" });
const isLoading = ref(false);

// Promise链式调用和async/await + try-catch-finally都能实现异步编程，且各有优劣
const handleLogin = async () => {
  // 如果正在加载中，直接返回
  if (isLoading.value) return;
  
  try {
    // 验证表单
    if (!form.username || !form.password) {
      ElMessage.error("请输入用户名和密码");
      return;
    }

    // 设置加载状态
    isLoading.value = true;

    const res = await http.post("/api/login", form);
    
    // 使用tokenManager存储token和刷新token
    tokenManager.setTokens({
      token: res.data.data.token,
      refreshToken: res.data.data.refreshToken,
      user: res.data.data.user
    });
    
    ElMessage.success("登录成功");
    router.push("/console/home"); // 跳转至后台管理页
  } catch (error) {
    console.error("登录失败", error);
    const errorMessage = error.response?.data?.message || "登录失败，请检查用户名和密码";
    ElMessage.error(errorMessage);
  } finally {
    // 无论成功还是失败，都要重置加载状态
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  min-height: 100vh; /* 视口高度 */
}
.login-image {
  width: 50vh;
  height: 50vh;
  margin-right: 20vh;
}

.login-container :deep(.el-input__suffix) {
  position: absolute;
  right: 8px;
  padding: 0;
}
</style>
