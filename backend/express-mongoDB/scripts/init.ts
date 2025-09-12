import mongoose from 'mongoose';
import User from '../src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const initDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db');
    
    // 创建默认管理员用户
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'watermelon',
        role: 'admin'
      });
      await adminUser.save();
      console.log('默认管理员用户已创建 (密码: watermelon)');
    } else {
      // 如果用户已存在，更新密码
      adminExists.password = 'watermelon';
      await adminExists.save();
      console.log('默认管理员用户密码已更新为: watermelon');
    }
    
    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

initDatabase();
