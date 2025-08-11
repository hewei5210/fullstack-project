const mongoose = require('mongoose');
const Translation = require('../src/models/Translation');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
require('dotenv').config();

const importCSV = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db');
    console.log('✅ 已连接至 MongoDB');
    
    // 读取 CSV 文件
    const csvPath = path.join(__dirname, '../../node-csv-server/data/bing.csv');
    console.log(`📁 读取 CSV 文件: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV 文件不存在:', csvPath);
      process.exit(1);
    }
    
    const csvData = fs.readFileSync(csvPath, 'utf8');
    console.log('✅ CSV 文件读取成功');
    
    // 解析 CSV 数据
    const parsedData = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });
    
    console.log(`📊 解析到 ${parsedData.data.length} 条数据`);
    
    if (parsedData.errors.length > 0) {
      console.error('❌ CSV 解析错误:', parsedData.errors);
      process.exit(1);
    }
    
    // 清空现有数据
    console.log('🗑️ 清空现有翻译数据...');
    await Translation.deleteMany({});
    console.log('✅ 现有数据已清空');
    
    // 转换数据格式并插入数据库
    console.log('📝 开始导入数据...');
    const translations = [];
    let skippedCount = 0;
    
    for (const row of parsedData.data) {
      // 检查必要字段是否存在且不为空
      if (!row.id || !row.Source) {
        console.log(`⚠️ 跳过无效数据: ID=${row.id}, Source=${row.Source}`);
        skippedCount++;
        continue;
      }
      
      const translation = new Translation({
        id: row.id,
        source: row.Source,
        target: {
          'zh-CN': row['target(zh-CN)'] || row.Source, // 如果中文为空，使用源文本
          'zh-HK': row['target(zh-HK)'] || row['target(zh-CN)'] || row.Source, // 如果繁体为空，使用简体或源文本
          'en-US': row['target(en-US)'] || row.Source // 如果英文为空，使用源文本
        }
      });
      translations.push(translation);
    }
    
    console.log(`📊 有效数据: ${translations.length} 条`);
    console.log(`⚠️ 跳过数据: ${skippedCount} 条`);
    
    // 批量插入数据
    await Translation.insertMany(translations);
    console.log(`✅ 成功导入 ${translations.length} 条翻译数据`);
    
    // 验证导入结果
    const totalCount = await Translation.countDocuments();
    console.log(`📊 数据库中的翻译项总数: ${totalCount}`);
    
    // 检查第一条和最后一条数据
    const firstItem = await Translation.findOne().sort({ id: 1 });
    const lastItem = await Translation.findOne().sort({ id: -1 });
    
    if (firstItem) {
      console.log(`📝 第一条数据: ${firstItem.id} - ${firstItem.source}`);
    }
    if (lastItem) {
      console.log(`📝 最后一条数据: ${lastItem.id} - ${lastItem.source}`);
    }
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    console.log('🎉 CSV 数据导入完成！');
    
  } catch (error) {
    console.error('❌ 导入数据时出错:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
};

importCSV();
