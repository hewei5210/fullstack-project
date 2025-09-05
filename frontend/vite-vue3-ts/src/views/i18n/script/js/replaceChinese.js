/**
 * 递归遍历指定文件夹中的所有 `.vue` 文件，根据输入的 JSON 文件内容，
 * 将 `.vue` 文件中与 JSON 文件 key 匹配的内容替换为指定的国际化函数形式，
 * 同时忽略注释内容，但保留注释。
 *
 * 功能步骤：
 * 1. 输入文件夹路径和 JSON 文件路径。
 * 2. 递归遍历所有 `.vue` 文件。
 * 3. 匹配 JSON 文件中的 key，替换为对应的国际化函数。
 * 4. 保留 HTML、JS 行注释、块注释和 CSS 注释，不参与替换。
 * 5. 保存修改后的 `.vue` 文件。
 *
 * 替换规则：
 * 1. <template>标签内的普通文本：替换为 {{ $t("ccfe-xxxxxxxxx") }}
 * 2. <template>中标签属性：添加冒号前缀，替换为 :placeholder="$t('ccfe-xxxxxxxxx')"
 * 3. <script>中的中文：替换为 this.$t("ccfe-xxxxxxxxx")
 */

const fs = require("fs");
const path = require("path");

/**
 * 转义正则表达式中的特殊字符
 * @param {string} str 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^=!:${}()|[\]/\\]/g, "\\$&");
}

/**
 * 递归遍历文件夹
 * @param {string} dir 文件夹路径
 * @param {string[]} fileList 用于存储文件路径的数组
 * @returns {string[]} 包含所有文件路径的数组
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith(".vue")) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

/**
 * 读取 JSON 文件并按value长度降序排序
 * @param {string} filePath JSON 文件路径
 * @returns {Object} 排序后的JSON文件内容
 */
function readJson(filePath) {
  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // 按value长度降序排序，防止短的中文语句被先匹配
  const sortedEntries = Object.entries(jsonData).sort((a, b) => {
    return b[1].length - a[1].length;
  });

  return Object.fromEntries(sortedEntries);
}

/**
 * 替换文件内容
 * @param {string} filePath 文件路径
 * @param {Object} jsonData JSON 数据
 * @param {number} currentIndex 当前文件索引（用于进度显示）
 * @param {number} totalCount 总文件数量
 */
function replaceFileContent(filePath, jsonData, currentIndex, totalCount) {
  const startTime = Date.now();
  const fileName = path.basename(filePath);

  let content = fs.readFileSync(filePath, "utf-8");
  let isModified = false;

  // 正则表达式提取注释，并用占位符临时替代
  const commentPlaceholders = {};
  let placeholderIndex = 0;

  // HTML 注释
  content = content.replace(/<!--[\s\S]*?-->/g, (match) => {
    const placeholder = `<!--COMMENT_${placeholderIndex++}-->`;
    commentPlaceholders[placeholder] = match;
    return placeholder;
  });

  // JavaScript 行注释
  content = content.replace(/\/\/[^\n]*\n/g, (match) => {
    const placeholder = `//COMMENT_${placeholderIndex++}-->`;
    commentPlaceholders[placeholder] = match;
    return placeholder;
  });

  // JavaScript 块注释
  content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const placeholder = `/*COMMENT_${placeholderIndex++}*/`;
    commentPlaceholders[placeholder] = match;
    return placeholder;
  });

  // CSS 注释
  content = content.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const placeholder = `/*COMMENT_${placeholderIndex++}*/`;
    commentPlaceholders[placeholder] = match;
    return placeholder;
  });

  // 分离 template 和 script 内容进行处理
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);

  let templateContent = templateMatch ? templateMatch[1] : "";
  let scriptContent = scriptMatch ? scriptMatch[1] : "";

  // 遍历排序后的 JSON 数据，替换匹配的 value
  for (const [key, value] of Object.entries(jsonData)) {
    const escapedValue = escapeRegExp(value);

    // 1. 处理 <template> 标签内的内容
    if (templateContent) {
      // 1.1 替换 <template> 标签内的普通文本（不在属性中）
      // 匹配 <div>文本</div> 或 <span>文本</span> 等形式的文本
      const templateTextRegex = new RegExp(
        `>([^<]*?)(${escapedValue})([^<]*?)<`,
        "g"
      );
      if (templateTextRegex.test(templateContent)) {
        templateContent = templateContent.replace(
          templateTextRegex,
          (match, before, target, after) => {
            return `>${before}{{ $t("${key}") }}${after}<`;
          }
        );
        isModified = true;
      }

      // 1.2 替换 <template> 中标签的属性值
      // 匹配 placeholder="中文" 或 title="中文" 等属性
      const attributeRegex = new RegExp(
        `(\\s+)(\\w+)=["'](${escapedValue})["']`,
        "g"
      );
      if (attributeRegex.test(templateContent)) {
        templateContent = templateContent.replace(
          attributeRegex,
          (match, spaces, attrName, target) => {
            return `${spaces}:${attrName}="$t('${key}')"`;
          }
        );
        isModified = true;
      }
    }

    // 2. 处理 <script> 标签内的内容
    if (scriptContent) {
      // 2.1 替换 <script> 中的中文字符串
      // 匹配单引号、双引号、模板字符串中的中文
      const scriptStringRegex = new RegExp(
        `(['"\`])([^'"\`]*?)(${escapedValue})([^'"\`]*?)(['"\`])`,
        "g"
      );
      if (scriptStringRegex.test(scriptContent)) {
        scriptContent = scriptContent.replace(
          scriptStringRegex,
          (match, quote1, before, target, after, quote2) => {
            return `${before}this.$t("${key}")${after}`;
          }
        );
        isModified = true;
      }
    }
  }

  // 重新组合内容
  if (templateMatch) {
    content = content.replace(
      templateMatch[0],
      `<template>${templateContent}</template>`
    );
  }
  if (scriptMatch) {
    content = content.replace(
      scriptMatch[0],
      `<script>${scriptContent}</script>`
    );
  }

  // 恢复注释部分
  content = content.replace(/<!--COMMENT_\d+-->/g, (match) => {
    return commentPlaceholders[match] || match;
  });

  content = content.replace(/\/\/COMMENT_\d+-->/g, (match) => {
    return commentPlaceholders[match] || match;
  });

  content = content.replace(/\/\*COMMENT_\d+\*\//g, (match) => {
    return commentPlaceholders[match] || match;
  });

  const endTime = Date.now();
  const duration = endTime - startTime;

  if (isModified) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(
      `✅ [${currentIndex}/${totalCount}] 已修改: ${fileName} (耗时: ${duration}ms)`
    );
  } else {
    console.log(
      `⏭️  [${currentIndex}/${totalCount}] 跳过: ${fileName} (无修改，耗时: ${duration}ms)`
    );
  }

  return isModified;
}

/**
 * 主函数
 * @param {string} folderPath 输入文件夹路径
 * @param {string} jsonPath JSON 文件路径
 */
function main(folderPath, jsonPath) {
  const totalStartTime = Date.now();
  console.log(`🚀 开始批量处理 Vue 文件...`);
  console.log(`📁 文件夹路径: ${folderPath}`);
  console.log(`📄 JSON 文件路径: ${jsonPath}`);

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ 文件夹不存在: ${folderPath}`);
    return;
  }
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON 文件不存在: ${jsonPath}`);
    return;
  }

  const jsonData = readJson(jsonPath);
  const vueFiles = getAllFiles(folderPath);

  console.log(`📊 发现 ${vueFiles.length} 个 Vue 文件待处理`);
  console.log(`🔤 JSON 数据包含 ${Object.keys(jsonData).length} 个国际化条目`);
  console.log(`⏳ 开始处理文件...\n`);

  let processedCount = 0;
  let modifiedCount = 0;

  vueFiles.forEach((file, index) => {
    processedCount++;
    const wasModified = replaceFileContent(
      file,
      jsonData,
      processedCount,
      vueFiles.length
    );
    if (wasModified) {
      modifiedCount++;
    }
  });

  const totalEndTime = Date.now();
  const totalDuration = totalEndTime - totalStartTime;

  console.log(`\n🎉 处理完成!`);
  console.log(`📈 处理统计:`);
  console.log(`   • 总文件数: ${vueFiles.length}`);
  console.log(`   • 已修改文件: ${modifiedCount}`);
  console.log(`   • 跳过文件: ${vueFiles.length - modifiedCount}`);
  console.log(`   • 总耗时: ${totalDuration}ms`);
  console.log(
    `   • 平均耗时: ${
      vueFiles.length > 0 ? Math.round(totalDuration / vueFiles.length) : 0
    }ms/文件`
  );
}

// 示例调用
const folderPath = "./src/views/eis/eisOverView"; // 替换为实际文件夹路径
const jsonPath = "./src/i18n/lang/zh-CN.json"; // 替换为实际 JSON 文件路径

main(folderPath, jsonPath);
