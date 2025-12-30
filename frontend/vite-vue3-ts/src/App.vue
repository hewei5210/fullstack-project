<template>
  <router-view />
  <!-- AI助手组件，悬浮在所有页面上 -->
  <AIAssistant />
</template>

<script setup lang="ts">
import AIAssistant from '@/components/AIAssistant.vue';
</script>
