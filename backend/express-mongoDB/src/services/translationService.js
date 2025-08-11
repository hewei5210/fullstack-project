const Translation = require('../models/Translation');
const ExcelJS = require('exceljs');
const Papa = require('papaparse');

class TranslationService {
  // 获取所有翻译项
  async getList(query = {}) {
    const { page = 1, pageSize = 10, sort = 'id' } = query;
    const skip = (page - 1) * pageSize;
    
    const translations = await Translation.find()
      .sort(sort)
      .skip(skip)
      .limit(parseInt(pageSize));
    
    const total = await Translation.countDocuments();
    
    return {
      data: translations,
      total,
      page: parseInt(page),
      limit: parseInt(pageSize)
    };
  }

  // 搜索翻译项
  async search(searchParams) {
    const { keyword, field = 'id' } = searchParams;
    
    let query = {};
    if (keyword) {
      if (field === 'id') {
        query.id = { $regex: keyword, $options: 'i' };
      } else if (field === 'zh-CN') {
        query['target.zh-CN'] = { $regex: keyword, $options: 'i' };
      } else if (field === 'en-US') {
        query['target.en-US'] = { $regex: keyword, $options: 'i' };
      } else if (field === 'zh-HK') {
        query['target.zh-HK'] = { $regex: keyword, $options: 'i' };
      }
    }
    
    return await Translation.find(query).sort('id');
  }

  // 添加翻译项
  async add(translationData) {
    const { id, source, target } = translationData;
    
    // 检查ID是否已存在
    const existing = await Translation.findOne({ id });
    if (existing) {
      throw new Error('翻译项ID已存在');
    }
    
    const translation = new Translation({
      id,
      source,
      target
    });
    
    return await translation.save();
  }

  // 更新翻译项
  async update(translationData) {
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
  async delete(id) {
    const translation = await Translation.findOneAndDelete({ id });
    if (!translation) {
      throw new Error('翻译项不存在');
    }
    return translation;
  }

  // 生成新ID
  async generateNewId() {
    const lastTranslation = await Translation.findOne().sort({ id: -1 });
    
    if (!lastTranslation) {
      return 'ccfe-1';
    }
    
    const lastNumber = parseInt(lastTranslation.id.split('-')[1]);
    return `ccfe-${lastNumber + 1}`;
  }

  // 批量导入
  async batchImport(fileBuffer) {
    const csvData = fileBuffer.toString('utf8');
    const parsedData = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });

    if (parsedData.errors.length > 0) {
      throw new Error('CSV文件格式错误');
    }

    const translations = [];
    for (const row of parsedData.data) {
      const translation = new Translation({
        id: row.id,
        source: row.Source,
        target: {
          'zh-CN': row['target(zh-CN)'],
          'zh-HK': row['target(zh-HK)'],
          'en-US': row['target(en-US)']
        }
      });
      translations.push(translation);
    }

    return await Translation.insertMany(translations, { ordered: false });
  }

  // 导出数据
  async exportData(langType = 'zh-CN') {
    const translations = await Translation.find().sort('id');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Translations');
    
    // 设置表头
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Source', key: 'source', width: 30 },
      { header: `Target(${langType})`, key: 'target', width: 40 }
    ];
    
    // 添加数据
    translations.forEach(item => {
      worksheet.addRow({
        id: item.id,
        source: item.source,
        target: item.target[langType]
      });
    });
    
    return workbook;
  }

  // 下载模板
  async downloadTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');
    
    // 设置表头
    worksheet.columns = [
      { header: 'id', key: 'id', width: 15 },
      { header: 'Source', key: 'source', width: 30 },
      { header: 'target(zh-CN)', key: 'zhCN', width: 40 },
      { header: 'target(zh-HK)', key: 'zhHK', width: 40 },
      { header: 'target(en-US)', key: 'enUS', width: 40 }
    ];
    
    // 添加示例数据
    worksheet.addRow({
      id: 'ccfe-1',
      source: 'Hello',
      zhCN: '你好',
      zhHK: '你好',
      enUS: 'Hello'
    });
    
    return workbook;
  }
}

module.exports = new TranslationService();