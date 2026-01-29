import mongoose from 'mongoose';
import User from '../src/models/User';
import Translation from '../src/models/Translation';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 导入翻译项数据
const importTranslations = async (): Promise<void> => {
  // 使用 path.resolve 确保路径正确（兼容 ts-node 和编译后的代码）
  const excelPath = path.resolve(__dirname, '../initData/翻译项数据_2026-01-29.xlsx');
  
  // 检查文件是否存在
  if (!fs.existsSync(excelPath)) {
    console.log(`警告: Excel 文件不存在: ${excelPath}`);
    console.log('跳过翻译项数据导入');
    return;
  }
  
  console.log(`开始导入翻译项数据: ${excelPath}`);
  
  // 读取Excel文件
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('Excel文件中没有找到工作表');
  }
  
  // 获取表头
  const headers: any[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.value;
  });
  
  console.log(`表头: ${headers.join(', ')}`);
  
  // 收集所有行数据
  const rows: Array<{ rowIndex: number; rowData: any }> = [];
  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return; // 跳过表头
    
    const rowData: any = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowData[header] = cell.value || '';
      }
    });
    
    rows.push({ rowIndex, rowData });
  });
  
  console.log(`共读取 ${rows.length} 行数据`);
  
  let imported = 0;
  let errors = 0;
  
  // 逐行处理并写入数据库
  for (const { rowIndex, rowData } of rows) {
    try {
      // 跳过空行
      if (Object.keys(rowData).length === 0) {
        continue;
      }
      
      // 支持多种表头格式
      let id: string | undefined;
      let zhCN: string = '';
      let enUS: string = '';
      let zhHK: string = '';
      
      // 尝试识别不同的表头格式
      // 支持多种ID字段名
      if (rowData.id) {
        id = String(rowData.id);
      } else if (rowData['翻译项ID']) {
        id = String(rowData['翻译项ID']);
      } else if (rowData['ID']) {
        id = String(rowData['ID']);
      }
      
      // 格式1: zh-CN, en-US, zh-HK
      if (rowData['zh-CN'] !== undefined) {
        zhCN = String(rowData['zh-CN'] || '');
        enUS = String(rowData['en-US'] || '');
        zhHK = String(rowData['zh-HK'] || '');
      }
      // 格式2: Source, 翻译项-英文, 翻译项-繁体
      else if (rowData.Source !== undefined || rowData['翻译项'] !== undefined) {
        zhCN = String(rowData.Source || rowData['翻译项'] || '');
        enUS = String(rowData['翻译项-英文'] || rowData['target(en-US)'] || rowData['en-US'] || '');
        zhHK = String(rowData['翻译项-繁体'] || rowData['target(zh-HK)'] || rowData['zh-HK'] || '');
      }
      // 格式3: 简体中文, 英文, 繁体中文
      else if (rowData['简体中文'] !== undefined) {
        zhCN = String(rowData['简体中文'] || '');
        enUS = String(rowData['英文'] || rowData['English'] || '');
        zhHK = String(rowData['繁体中文'] || '');
      }
      // 格式4: 第一列是中文，第二列是英文，第三列是繁体
      else {
        const values = Object.values(rowData);
        if (values.length >= 1) {
          zhCN = String(values[0] || '');
          enUS = String(values[1] || '');
          zhHK = String(values[2] || '');
        }
      }
      
      // 跳过空行
      if (!zhCN || zhCN.trim() === '') {
        continue;
      }
      
      // 如果没有ID，跳过该行（Excel数据中应该已经包含ID）
      if (!id || id.trim() === '') {
        console.warn(`第 ${rowIndex} 行缺少ID，跳过该行`);
        continue;
      }
      
      // 检查ID是否已存在，如果存在则更新，否则创建新记录
      const existingTranslation = await Translation.findOne({ id: id.trim() });
      
      if (existingTranslation) {
        // 更新现有记录
        existingTranslation.source = zhCN.trim();
        existingTranslation.target = {
          'zh-CN': zhCN.trim(),
          'en-US': enUS.trim(),
          'zh-HK': zhHK.trim()
        };
        existingTranslation.status = 'ready';
        await existingTranslation.save();
      } else {
        // 创建新翻译项
        const translation = new Translation({
          id: id.trim(),
          source: zhCN.trim(),
          target: {
            'zh-CN': zhCN.trim(),
            'en-US': enUS.trim(),
            'zh-HK': zhHK.trim()
          },
          status: 'ready'
        });
        await translation.save();
      }
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`已导入 ${imported} 条数据...`);
      }
    } catch (error) {
      errors++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`第 ${rowIndex} 行导入失败:`, errorMsg);
    }
  }
  
  console.log(`\n翻译项数据导入完成:`);
  console.log(`  - 成功导入: ${imported} 条`);
  console.log(`  - 导入失败: ${errors} 条`);
};

const initDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translation_db');
    console.log('MongoDB 连接成功');
    
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
    
    // 导入翻译项数据
    await importTranslations();
    
    console.log('数据库初始化完成');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

initDatabase();
