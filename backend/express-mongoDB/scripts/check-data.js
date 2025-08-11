const mongoose = require('mongoose');
const Translation = require('../src/models/Translation');
require('dotenv').config();

const checkData = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db');
    console.log('✅ 已连接至 MongoDB');
    
    // 检查翻译数据总数
    const totalCount = await Translation.countDocuments();
    console.log(`📊 数据库中的翻译项总数: ${totalCount}`);
    
    // 检查前几条数据
    const sampleData = await Translation.find().limit(5);
    console.log('\n📋 前5条数据示例:');
    sampleData.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}`);
      console.log(`   源文本: ${item.source}`);
      console.log(`   中文: ${item.target['zh-CN']}`);
      console.log(`   英文: ${item.target['en-US']}`);
      console.log(`   繁体: ${item.target['zh-HK']}`);
      console.log('');
    });
    
    // 检查是否有特定的数据
    const specificItem = await Translation.findOne({ id: 'ccfe-000000001' });
    if (specificItem) {
      console.log('✅ 找到第一条数据 (ccfe-000000001)');
    } else {
      console.log('❌ 未找到第一条数据 (ccfe-000000001)');
    }
    
    // 检查最后一条数据
    const lastItem = await Translation.findOne().sort({ id: -1 });
    if (lastItem) {
      console.log(`📝 最后一条数据 ID: ${lastItem.id}`);
    }
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 检查数据时出错:', error.message);
    process.exit(1);
  }
};

checkData();
