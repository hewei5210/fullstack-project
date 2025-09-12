import Translation from '../models/Translation';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { 
  IPaginationQuery, 
  IPaginationResponse, 
  ISearchQuery, 
  ICreateTranslation, 
  IUpdateTranslation,
  IExportQuery,
  ITranslation 
} from '../types';

class TranslationService {
  // 获取所有翻译项
  async getList(query: IPaginationQuery = {}): Promise<IPaginationResponse<ITranslation>> {
    const { page = 1, pageSize = 10, sort = 'id' } = query;
    const skip = (page - 1) * pageSize;
    
    const translations = await Translation.find()
      .sort(sort)
      .skip(skip)
      .limit(parseInt(pageSize.toString()));
    
    const total = await Translation.countDocuments();
    
    return {
      data: translations,
      total,
      page: parseInt(page.toString()),
      pageSize: parseInt(pageSize.toString()),
      totalPages: Math.ceil(total / parseInt(pageSize.toString()))
    };
  }

  // 搜索翻译项
  async search(searchParams: ISearchQuery): Promise<IPaginationResponse<ITranslation>> {
    const { searchContent, searchSelect = 'id', page = 1, pageSize = 10 } = searchParams;
    
    let query: any = {};
    if (searchContent) {
      if (searchSelect === 'id') {
        query.id = { $regex: searchContent, $options: 'i' };
      } else if (searchSelect === 'zh-CN') {
        // 搜索source字段，因为zh-CN的内容存储在source中
        query.source = { $regex: searchContent, $options: 'i' };
      } else if (searchSelect === 'en-US') {
        query['target.en-US'] = { $regex: searchContent, $options: 'i' };
      } else if (searchSelect === 'zh-HK') {
        query['target.zh-HK'] = { $regex: searchContent, $options: 'i' };
      }
    }
    
    const skip = (page - 1) * pageSize;
    
    const translations = await Translation.find(query)
      .sort('id')
      .skip(skip)
      .limit(parseInt(pageSize.toString()));
    
    const total = await Translation.countDocuments(query);
    
    return {
      data: translations,
      total,
      page: parseInt(page.toString()),
      pageSize: parseInt(pageSize.toString()),
      totalPages: Math.ceil(total / parseInt(pageSize.toString()))
    };
  }

  // 添加翻译项
  async add(translationData: ICreateTranslation): Promise<ITranslation> {
    const { target } = translationData;
    
    // 检查翻译项是否已存在
    const existingTranslation = await Translation.findOne({ source: target['zh-CN'] });
    if (existingTranslation) {
      throw new Error('翻译项已存在，无法重复添加');
    }
    
    // 自动生成新ID
    const id = await this.generateNewId();
    console.log('新生成的id', id);
    
    const translation = new Translation({
      id,
      source: target['zh-CN'],
      target
    });
    
    return await translation.save();
  }

  // 更新翻译项
  async update(translationData: IUpdateTranslation): Promise<ITranslation> {
    const { id, source, target } = translationData;
    
    const translation = await Translation.findOneAndUpdate(
      { id },
      { source, target },
      { new: true, runValidators: true }
    );
    
    if (!translation) {
      throw new Error('翻译项不存在');
    }
    
    return translation;
  }

  // 删除翻译项
  async delete(id: string): Promise<ITranslation> {
    const translation = await Translation.findOneAndDelete({ id });
    if (!translation) {
      throw new Error('翻译项不存在');
    }
    return translation;
  }

  // 生成新ID - 寻找空缺的ID
  async generateNewId(): Promise<string> {
    // 获取所有翻译项，按ID排序
    const translations = await Translation.find().sort({ id: 1 });
    
    if (translations.length === 0) {
      return 'ccfe-000000001';
    }
    
    // 提取所有ID的数字部分
    const existingNumbers = translations.map(item => {
      const match = item.id.match(/ccfe-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter(num => num > 0).sort((a, b) => a - b);
    
    // 寻找第一个空缺的数字
    let expectedNumber = 1;
    for (const num of existingNumbers) {
      if (num > expectedNumber) {
        // 找到了空缺
        break;
      }
      expectedNumber = num + 1;
    }
    
    // 格式化ID，确保9位数字格式
    return `ccfe-${expectedNumber.toString().padStart(9, '0')}`;
  }

  // 导出Json数据
  async exportJsonData(langType: 'zh-CN' | 'en-US' | 'zh-HK' = 'zh-CN') {
    const translations = await Translation.find().sort('id');
    
    let jsonData: Record<string, string> = {};

    if (langType === "zh-CN" || langType === "zh-HK" || langType === "en-US") {
      translations.forEach((item) => {
        jsonData[item.id] = item.target[langType];
      });
    }

    const fileName = `${langType}.json`;
    // 使用绝对路径，确保文件创建在正确位置
    const filePath = path.join(process.cwd(), "exports", fileName);
    const jsonContent = JSON.stringify(jsonData, null, 2);

    // 确保导出目录存在
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(filePath, jsonContent);
    console.log('文件写入成功:', filePath);

    return {
      filePath,
      fileName,
      done: () => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('临时文件清理成功:', filePath);
          }
        } catch (error) {
          console.error('清理临时文件失败:', error);
        }
      },
    };
  }

  // 下载模板
  downloadTemplate(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('翻译模板');
    
    // 设置表头
    worksheet.columns = [
      { header: "翻译项", key: "zh-CN", width: 30 },
      { header: "翻译项-英文", key: "en-US", width: 30 },
      { header: "翻译项-繁体", key: "zh-HK", width: 30 },
    ];
    
    return workbook;
  }

  // 导出EXCEL数据
  async exportExcelData(includeId = false): Promise<ExcelJS.Workbook> {
    const translations = await Translation.find().sort('id');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('翻译数据');
    
    // 根据是否包含ID设置表头
    if (includeId) {
      worksheet.columns = [
        { header: "翻译项ID", key: "id", width: 20 },
        { header: "翻译项", key: "zh-CN", width: 30 },
        { header: "翻译项-英文", key: "en-US", width: 30 },
        { header: "翻译项-繁体", key: "zh-HK", width: 30 },
      ];
    } else {
      worksheet.columns = [
        { header: "翻译项", key: "zh-CN", width: 30 },
        { header: "翻译项-英文", key: "en-US", width: 30 },
        { header: "翻译项-繁体", key: "zh-HK", width: 30 },
      ];
    }
    
    // 添加数据行
    translations.forEach(translation => {
      const rowData: any = {
        'zh-CN': translation.source || '',
        'en-US': translation.target['en-US'] || '',
        'zh-HK': translation.target['zh-HK'] || ''
      };
      
      if (includeId) {
        rowData.id = translation.id;
      }
      
      worksheet.addRow(rowData);
    });
    
    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    return workbook;
  }
}

export default new TranslationService();
