#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
require('dotenv').config();

// 连接数据库
const mongoose = require('mongoose');
const csvSyncService = require('../src/services/csvSyncService');

// 命令行参数解析
const args = process.argv.slice(2);
const command = args[0];

// 帮助信息
const help = `
CSV同步工具

用法:
  node sync-csv.js <command> [options]

命令:
  sync <file>             同步CSV文件到MongoDB
  export <file>           从MongoDB导出数据到CSV
  stats                   显示同步统计信息
  clean                   清理重复数据
  validate <file>         验证CSV文件格式

选项:
  --skip-duplicates       跳过重复记录
  --update-existing       更新现有记录
  --batch-size <number>   批处理大小 (默认: 1000)
  --filter <json>         导出时的过滤条件

示例:
  node sync-csv.js sync ../node-csv-server/data/bing.csv
  node sync-csv.js sync ../node-csv-server/data/bing.csv --update-existing
  node sync-csv.js export translations_export.csv
  node sync-csv.js stats
  node sync-csv.js clean
  node sync-csv.js validate ../node-csv-server/data/bing.csv
`;

// 连接数据库
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/i18n-platform';
    await mongoose.connect(mongoURI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

// 解析命令行选项
function parseOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--skip-duplicates') {
      options.skipDuplicates = true;
    } else if (arg === '--update-existing') {
      options.updateExisting = true;
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--filter' && args[i + 1]) {
      try {
        options.filter = JSON.parse(args[i + 1]);
        i++;
      } catch (e) {
        console.error('❌ 过滤条件JSON格式错误');
        process.exit(1);
      }
    }
  }
  return options;
}

// 同步CSV文件
async function syncCsv(filePath, options = {}) {
  try {
    console.log(`🔄 开始同步CSV文件: ${filePath}`);
    
    const syncOptions = {
      skipDuplicates: options.skipDuplicates !== false,
      updateExisting: options.updateExisting !== false,
      batchSize: options.batchSize || 1000,
      onProgress: (progress, stats) => {
        process.stdout.write(`\r📊 进度: ${progress.toFixed(1)}% (${stats.processed}/${stats.total})`);
      }
    };

    const result = await csvSyncService.syncCsvToMongoDB(filePath, syncOptions);
    
    console.log('\n✅ 同步完成!');
    console.log(`📈 统计信息:`);
    console.log(`   - 总记录数: ${result.total}`);
    console.log(`   - 新增: ${result.inserted}`);
    console.log(`   - 更新: ${result.updated}`);
    console.log(`   - 跳过: ${result.skipped}`);
    console.log(`   - 错误: ${result.errors}`);
    
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  }
}

// 导出数据
async function exportCsv(outputPath, options = {}) {
  try {
    console.log(`📤 开始导出数据到: ${outputPath}`);
    
    const result = await csvSyncService.exportToCsv(outputPath, options.filter || {});
    
    console.log('✅ 导出完成!');
    console.log(`📈 导出统计:`);
    console.log(`   - 导出记录数: ${result.exported}`);
    console.log(`   - 文件路径: ${result.filePath}`);
    
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    process.exit(1);
  }
}

// 显示统计信息
async function showStats() {
  try {
    console.log('📊 获取同步统计信息...');
    
    const stats = await csvSyncService.getSyncStats();
    
    console.log('✅ 统计信息:');
    console.log(`   - 总记录数: ${stats.total}`);
    console.log(`   - 就绪状态: ${stats.ready}`);
    console.log(`   - 待处理: ${stats.pending}`);
    console.log(`   - 错误状态: ${stats.error}`);
    
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error.message);
    process.exit(1);
  }
}

// 清理重复数据
async function cleanDuplicates() {
  try {
    console.log('🧹 开始清理重复数据...');
    
    const result = await csvSyncService.cleanDuplicates();
    
    console.log('✅ 清理完成!');
    console.log(`📈 清理统计:`);
    console.log(`   - 发现重复组: ${result.duplicatesFound}`);
    console.log(`   - 删除记录: ${result.deleted}`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
    process.exit(1);
  }
}

// 验证CSV文件
async function validateCsv(filePath) {
  try {
    console.log(`🔍 验证CSV文件: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }

    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const Papa = require('papaparse');
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      trimValues: true
    });

    console.log('✅ 验证完成!');
    console.log(`📈 文件信息:`);
    console.log(`   - 总行数: ${parseResult.data.length}`);
    console.log(`   - 错误数: ${parseResult.errors.length}`);
    console.log(`   - 列名: ${parseResult.meta.fields?.join(', ') || '无'}`);
    console.log(`   - 格式有效: ${parseResult.errors.length === 0 ? '是' : '否'}`);
    
    if (parseResult.errors.length > 0) {
      console.log('\n⚠️  解析错误:');
      parseResult.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. 行 ${error.row}: ${error.message}`);
      });
    }
    
    if (parseResult.data.length > 0) {
      console.log('\n📋 数据示例 (前3行):');
      parseResult.data.slice(0, 3).forEach((row, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(row)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(help);
    return;
  }

  try {
    await connectDB();

    switch (command) {
      case 'sync':
        const syncFilePath = args[1];
        if (!syncFilePath) {
          console.error('❌ 请提供CSV文件路径');
          process.exit(1);
        }
        const syncOptions = parseOptions(args.slice(2));
        await syncCsv(syncFilePath, syncOptions);
        break;

      case 'export':
        const exportFilePath = args[1] || `translations_${Date.now()}.csv`;
        const exportOptions = parseOptions(args.slice(2));
        await exportCsv(exportFilePath, exportOptions);
        break;

      case 'stats':
        await showStats();
        break;

      case 'clean':
        await cleanDuplicates();
        break;

      case 'validate':
        const validateFilePath = args[1];
        if (!validateFilePath) {
          console.error('❌ 请提供CSV文件路径');
          process.exit(1);
        }
        await validateCsv(validateFilePath);
        break;

      default:
        console.error(`❌ 未知命令: ${command}`);
        console.log(help);
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 数据库连接已关闭');
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  syncCsv,
  exportCsv,
  showStats,
  cleanDuplicates,
  validateCsv
};
