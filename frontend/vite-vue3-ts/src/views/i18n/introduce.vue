<template>
  <div class="i18n-intro">
    <el-card class="intro-card">
      <template #header>
        <div class="card-header">
          <span>国际化介绍</span>
        </div>
      </template>
      
      <div class="intro-content">
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
        
        <h3>使用流程：</h3>
        <el-steps :active="1" finish-status="success">
          <el-step title="提取文本" description="从代码中提取需要翻译的文本"></el-step>
          <el-step title="翻译管理" description="在系统中管理翻译内容"></el-step>
          <el-step title="生成资源" description="生成各语言的资源文件"></el-step>
          <el-step title="集成部署" description="将翻译集成到应用中"></el-step>
        </el-steps>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 国际化介绍页面逻辑
</script>

<style scoped>
.i18n-intro {
  padding: 20px;
}

.intro-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.intro-content {
  line-height: 1.6;
}

.intro-content h2 {
  color: #409eff;
  margin-bottom: 16px;
}

.intro-content h3 {
  color: #606266;
  margin: 24px 0 16px 0;
}

.intro-content ul {
  padding-left: 20px;
}

.intro-content li {
  margin-bottom: 8px;
}

.feature-card {
  text-align: center;
  margin-bottom: 20px;
}

.feature-card h4 {
  color: #409eff;
  margin-bottom: 12px;
}

.el-steps {
  margin-top: 30px;
}
</style>
