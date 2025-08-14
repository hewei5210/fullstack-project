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
    const { source, target } = translationData;
    
    // 检查翻译项是否已存在
    const existingTranslation = await Translation.findOne({ source });
    if (existingTranslation) {
      throw new Error('翻译项已存在，无法重复添加');
    }
    
    // 自动生成新ID
    const id = await this.generateNewId();
    console.log('新生成的id', id);
    
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

  // 生成新ID - 寻找空缺的ID
  async generateNewId() {
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

    const results = {
      data: [],
      total: 0,
      success: 0,
      errors: []
    };

    // 获取现有翻译项用于去重检查
    const existingTranslations = await Translation.find();
    const existingSources = new Set(existingTranslations.map(item => item.source));
    const internalSet = new Set(); // 检查CSV内部重复

    for (let i = 0; i < parsedData.data.length; i++) {
      const row = parsedData.data[i];
      results.total++;

      const cellValue = row.Source || row['翻译项'];

      // 1. 优先检测CSV内部重复
      if (internalSet.has(cellValue)) {
        results.errors.push({
          row: i + 2, // +2 因为跳过表头且数组从0开始
          message: 'CSV内部重复'
        });
        continue;
      }
      internalSet.add(cellValue);

      // 2. 检查数据库中是否已存在
      if (existingSources.has(cellValue)) {
        results.errors.push({
          row: i + 2,
          message: '翻译项已存在，无法重复添加'
        });
        continue;
      }

      try {
        // 自动生成新ID
        const id = await this.generateNewId();
        
        const translation = new Translation({
          id,
          source: cellValue,
          target: {
            'zh-CN': cellValue,
            'en-US': row['翻译项-英文'] || row['target(en-US)'] || '',
            'zh-HK': row['翻译项-繁体'] || row['target(zh-HK)'] || ''
          }
        });

        // 数据校验
        if (!translation.id || !translation.source || !translation.target['zh-CN']) {
          throw new Error('必填字段缺失');
        }

        results.data.push(translation);
        results.success++;
      } catch (error) {
        results.errors.push({
          row: i + 2,
          message: error.message
        });
      }
    }

    // 批量插入成功的数据
    if (results.data.length > 0) {
      await Translation.insertMany(results.data, { ordered: false });
    }

    return {
      code: 200,
      data: results,
      message: `导入 ${results.total} 条数据，去除重复数据，成功导入${results.data.length}条数据，失败 ${results.errors.length} 条数据`
    };
  }

  // 导出Json数据
  async exportJsonData(langType = 'zh-CN') {
    const fs = require('fs');
    const path = require('path');
    
    const translations = await Translation.find().sort('id');
    
    let jsonData = {};

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
  downloadTemplate() {
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

  // 下载批量修改模板
  downloadUpdateTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('批量修改模板');
    
    // 设置表头 - 包含翻译项ID
    worksheet.columns = [
      { header: "翻译项ID", key: "id", width: 20 },
      { header: "翻译项", key: "zh-CN", width: 30 },
      { header: "翻译项-英文", key: "en-US", width: 30 },
      { header: "翻译项-繁体", key: "zh-HK", width: 30 },
    ];
    
    return workbook;
  }

  // 批量修改
  async batchUpdate(fileBuffer) {
    const csvData = fileBuffer.toString('utf8');
    const parsedData = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });

    if (parsedData.errors.length > 0) {
      throw new Error('CSV文件格式错误');
    }

    const results = {
      total: 0,
      success: 0,
      errors: []
    };

    // 获取所有现有翻译项的ID用于验证
    const existingTranslations = await Translation.find();
    const existingIds = new Set(existingTranslations.map(item => item.id));

    for (let i = 0; i < parsedData.data.length; i++) {
      const row = parsedData.data[i];
      results.total++;

      const translationId = row.ID || row['翻译项ID'];
      const source = row.Source || row['翻译项'];

      // 检查翻译项ID是否存在
      if (!translationId) {
        results.errors.push({
          row: i + 2,
          message: '翻译项ID不能为空'
        });
        continue;
      }

      if (!existingIds.has(translationId)) {
        results.errors.push({
          row: i + 2,
          message: `翻译项ID "${translationId}" 不存在`
        });
        continue;
      }

      try {
        // 构建更新数据
        const updateData = {
          source: source || '',
          target: {
            'zh-CN': source || '',
            'en-US': row['翻译项-英文'] || row['target(en-US)'] || '',
            'zh-HK': row['翻译项-繁体'] || row['target(zh-HK)'] || ''
          }
        };

        // 数据校验
        if (!updateData.source) {
          throw new Error('翻译项内容不能为空');
        }

        // 执行更新
        const updatedTranslation = await Translation.findOneAndUpdate(
          { id: translationId },
          updateData,
          { new: true, runValidators: true }
        );

        if (!updatedTranslation) {
          throw new Error('更新失败');
        }

        results.success++;
      } catch (error) {
        results.errors.push({
          row: i + 2,
          message: error.message
        });
      }
    }

    return {
      code: 200,
      data: results,
      message: `批量修改 ${results.total} 条数据，成功修改 ${results.success} 条数据，失败 ${results.errors.length} 条数据`
    };
  }

  // 批量获取翻译项ID
  async batchGetIds(fileBuffer) {
    const csvData = fileBuffer.toString('utf8');
    const parsedData = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true
    });

    if (parsedData.errors.length > 0) {
      throw new Error('CSV文件格式错误');
    }

    const results = {
      total: 0,
      success: 0,
      errors: [],
      data: []
    };

    for (let i = 0; i < parsedData.data.length; i++) {
      const row = parsedData.data[i];
      results.total++;

      const source = row.Source || row['翻译项'];

      // 检查翻译项是否为空
      if (!source) {
        results.errors.push({
          row: i + 2,
          message: '翻译项不能为空'
        });
        continue;
      }

      try {
        // 在数据库中搜索翻译项
        const translation = await Translation.findOne({ source: source });
        
        if (!translation) {
          results.errors.push({
            row: i + 2,
            message: `翻译项 "${source}" 在数据库中不存在`
          });
          continue;
        }

        // 构建结果数据
        const resultItem = {
          id: translation.id,
          source: translation.source,
          'en-US': translation.target['en-US'] || '',
          'zh-HK': translation.target['zh-HK'] || ''
        };

        results.data.push(resultItem);
        results.success++;
      } catch (error) {
        results.errors.push({
          row: i + 2,
          message: error.message
        });
      }
    }

    return {
      code: 200,
      data: results,
      message: `批量获取 ${results.total} 条数据，成功获取 ${results.success} 条数据，失败 ${results.errors.length} 条数据`
    };
  }

  // 下载批量获取ID模板
  downloadGetIdsTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('批量获取ID模板');
    
    // 设置表头 - 只需要翻译项，其他可选
    worksheet.columns = [
      { header: "翻译项", key: "zh-CN", width: 30 },
      { header: "翻译项-英文", key: "en-US", width: 30 },
      { header: "翻译项-繁体", key: "zh-HK", width: 30 },
    ];
    
    return workbook;
  }

  // 导出批量获取ID结果
  async exportGetIdsResult(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('翻译项ID结果');
    
    // 设置表头
    worksheet.columns = [
      { header: "翻译项ID", key: "id", width: 20 },
      { header: "翻译项", key: "zh-CN", width: 30 },
      { header: "翻译项-英文", key: "en-US", width: 30 },
      { header: "翻译项-繁体", key: "zh-HK", width: 30 },
    ];
    
    // 添加数据行
    data.forEach(item => {
      worksheet.addRow({
        id: item.id,
        'zh-CN': item.source,
        'en-US': item['en-US'],
        'zh-HK': item['zh-HK']
      });
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

  // 导出EXCEL数据
  async exportExcelData(includeId = false) {
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
      const rowData = {
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

module.exports = new TranslationService();