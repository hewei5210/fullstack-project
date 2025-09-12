import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db';
    console.log('正在连接数据库:', mongoURI);
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('数据库连接失败，但服务器将继续运行（仅用于开发）');
    // 开发环境下不退出进程
    // process.exit(1);
  }
};

export default connectDB;
