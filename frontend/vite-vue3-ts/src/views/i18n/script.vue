<template>
  <div class="container">
    <h2>自动化脚本工具</h2>
    <p>提供各种自动化脚本来简化国际化工作流程，提高开发效率。</p>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="文本提取脚本" name="extract">
        <div class="script-section">
          <h3>Vue.js 文本提取脚本</h3>
          <el-card class="code-card">
            <pre><code>{{ extractScript }}</code></pre>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="资源生成脚本" name="generate">
        <div class="script-section">
          <h3>多语言资源生成脚本</h3>
          <el-card class="code-card">
            <pre><code>{{ generateScript }}</code></pre>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量处理脚本" name="batch">
        <div class="script-section">
          <h3>批量翻译处理脚本</h3>
          <el-card class="code-card">
            <pre><code>{{ batchScript }}</code></pre>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const activeTab = ref("extract");

// 提取脚本代码到变量中
const extractScript = `// extract-vue-text.js
const fs = require('fs');
const path = require('path');

function extractVueText(dir) {
  const translations = new Set();
  
  function scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.vue')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/\\$t\\(['"\`]([^'"\`]+)['"\`]\\)/g);
        
        if (matches) {
          matches.forEach(match => {
            const key = match.match(/\\$t\\(['"\`]([^'"\`]+)['"\`]\\)/)[1];
            translations.add(key);
          });
        }
      }
    });
  }
  
  scanDirectory(dir);
  return Array.from(translations);
}

module.exports = { extractVueText };`;

const generateScript = `// generate-i18n-resources.js
const fs = require('fs');
const path = require('path');

function generateI18nResources(translations, languages) {
  const resources = {};
  
  languages.forEach(lang => {
    resources[lang] = {};
    
    Object.keys(translations).forEach(key => {
      resources[lang][key] = translations[key][lang] || translations[key]['zh-CN'];
    });
  });
  
  // 生成各语言文件
  Object.keys(resources).forEach(lang => {
    const filePath = path.join(__dirname, \`locales/\${lang}.json\`);
    fs.writeFileSync(filePath, JSON.stringify(resources[lang], null, 2));
  });
}

module.exports = { generateI18nResources };`;

const batchScript = `// batch-translate.js
const fs = require('fs');
const csv = require('csv-parser');

async function batchTranslate(inputFile, outputFile) {
  const results = [];
  
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (data) => {
      // 处理每一行翻译数据
      results.push({
        id: data.id,
        source: data.source,
        'zh-CN': data['zh-CN'],
        'en-US': data['en-US'],
        'zh-HK': data['zh-HK']
      });
    })
    .on('end', () => {
      // 写入处理后的数据
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log('批量处理完成');
    });
}

module.exports = { batchTranslate };`;

</script>

<style scoped>
.container {
  margin: 10px;
  padding: 20px;
  background-color: #fff;
  min-height: 600px;
}

.script-section {
  margin-bottom: 30px;
}

.code-card {
  margin: 16px 0;
  background-color: #f5f7fa;
}

.code-card pre {
  margin: 0;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow-x: auto;
}

.code-card code {
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.4;
}

.usage-guide {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid #ebeef5;
}

.usage-guide h3 {
  color: #606266;
  margin-bottom: 20px;
}
</style>
