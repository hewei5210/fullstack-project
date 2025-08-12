const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db', {
      serverSelectionTimeoutMS: 10000, // 10秒超时
      socketTimeoutMS: 45000, // 45秒超时
    });
    
    console.log(`✅ 已连接至 MongoDB: ${conn.connection.host}`);
    
    // 创建索引
    try {
      await mongoose.connection.db.collection('translations').createIndex({ id: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ username: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      console.log('✅ 数据库索引创建成功');
    } catch (indexError) {
      console.log('⚠️ 索引可能已存在:', indexError.message);
    }
    
  } catch (err) {
    console.error('❌ 连接数据库失败:', err.message);
    console.error('请确保 MongoDB 服务正在运行');
    console.error('Windows 检查命令: Get-Service -Name MongoDB');
    console.error('或者手动启动: Start-Service MongoDB');
    process.exit(1);
  }
};

module.exports = connectDB;