const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db');
    console.log('✅ 已连接至 MongoDB');
    
    // 查找管理员用户
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (adminUser) {
      console.log('✅ 找到管理员用户:');
      console.log(`   用户名: ${adminUser.username}`);
      console.log(`   邮箱: ${adminUser.email}`);
      console.log(`   角色: ${adminUser.role}`);
      console.log(`   创建时间: ${adminUser.createdAt}`);
      
      // 测试密码验证
      const isPasswordValid = await adminUser.comparePassword('watermelon');
      console.log(`   密码验证 (watermelon): ${isPasswordValid ? '✅ 正确' : '❌ 错误'}`);
      
      const isOldPasswordValid = await adminUser.comparePassword('admin123');
      console.log(`   密码验证 (admin123): ${isOldPasswordValid ? '✅ 正确' : '❌ 错误'}`);
      
    } else {
      console.log('❌ 未找到管理员用户');
    }
    
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 检查管理员用户时出错:', error.message);
    process.exit(1);
  }
};

checkAdmin();
