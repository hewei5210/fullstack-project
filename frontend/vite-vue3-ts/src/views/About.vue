<!-- src/views/About.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const teamMembers = ref([
  { name: '张三', role: 'CTO', avatar: '/images/avatar1.png' },
  { name: '李四', role: '前端工程师', avatar: '/images/avatar2.png' }
])
</script>

<template>
  <div class="about-container">
    <h1 class="title">关于我们</h1>
    
    <section class="content-section">
      <h2>公司简介</h2>
      <p class="desc">我们是一家专注于 Web 前端技术创新的科技公司，成立于 2020 年，致力于为企业提供高性能的前端解决方案...</p>
    </section>

    <el-divider />

    <section class="team-section">
      <h2>核心团队</h2>
      <div class="member-grid">
        <div 
          v-for="(member, index) in teamMembers" 
          :key="index"
          class="member-card"
        >
          <img :src="member.avatar" alt="头像" class="avatar">
          <h3>{{ member.name }}</h3>
          <p>{{ member.role }}</p>
        </div>
      </div>
    </section>

    <el-divider />

    <section class="contact-section">
      <h2>联系我们</h2>
      <div class="contact-info">
        <p>📧 Email: contact@example.com</p>
        <p>📱 电话: 400-123-4567</p>
        <p>📍 地址: 上海市浦东新区科技园</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.member-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .about-container {
    padding: 1rem;
  }
}
</style>