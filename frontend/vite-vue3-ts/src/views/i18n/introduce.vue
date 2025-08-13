<template>
  <div class="container">
    <h2>什么是国际化？</h2>
    <p>国际化（Internationalization，简称 i18n）是指软件的设计和开发过程中，使软件能够适应不同语言和地区需求的过程。</p>
    
    <h3>主要特点：</h3>
    <ul>
      <li><strong>多语言支持</strong>：支持中文、英文、繁体中文等多种语言</li>
      <li><strong>本地化适配</strong>：根据地区习惯调整日期、货币、数字格式</li>
      <li><strong>文化适应性</strong>：考虑不同文化的用户习惯和偏好</li>
    </ul>
    
    <h3>我们的国际化方案：</h3>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="feature-card">
          <h4>翻译管理</h4>
          <p>集中管理所有翻译文本，支持批量导入导出</p>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="feature-card">
          <h4>脚本工具</h4>
          <p>自动化脚本帮助快速提取和更新翻译内容</p>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="feature-card">
          <h4>插件支持</h4>
          <p>提供各种开发框架的国际化插件</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
// 国际化介绍页面逻辑
</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}
</style>