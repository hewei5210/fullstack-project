"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db';
        console.log('正在连接数据库:', mongoURI);
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('Database connection error:', error);
        console.log('数据库连接失败，但服务器将继续运行（仅用于开发）');
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map