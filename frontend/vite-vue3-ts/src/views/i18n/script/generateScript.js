/**
 * 多语言资源生成脚本
 * 用于根据翻译数据生成各语言的资源文件
 */

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
    const filePath = path.join(__dirname, 'locales/' + lang + '.json');
    fs.writeFileSync(filePath, JSON.stringify(resources[lang], null, 2));
  });
}

module.exports = { generateI18nResources };
