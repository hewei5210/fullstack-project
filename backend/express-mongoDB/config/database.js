const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/mydb');
    
    console.log(`已连接至 ${conn.connection.host}`);
  } catch (err) {
    console.error('连接数据库失败');
    process.exit(1);
  }
};

module.exports = connectDB;