<template>
  <div class="login-container">
    <el-form @submit.prevent="handleLogin">
      <h2>用户登录</h2>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>
      <el-button type="primary" native-type="submit">登录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { http } from "@/net/http";

const router = useRouter();
const form = reactive({ username: "", password: "" });

const handleLogin = async () => {
  try {
    const res = await http.post("/api/login", form);
    localStorage.setItem("token", res.data.token);
    router.push("/console/home"); // 跳转至后台管理页
  } catch (error) {
    console.error("登录失败", error);
  }
};
</script>
