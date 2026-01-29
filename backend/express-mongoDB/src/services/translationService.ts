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
    
    // 将字符串类型的 exactMatch 转换为布尔值
    // HTTP GET 请求的查询参数都是字符串，需要显式转换
    let exactMatch = false;
    if (searchParams.exactMatch !== undefined) {
      if (typeof searchParams.exactMatch === 'string') {
        exactMatch = searchParams.exactMatch === 'true';
      } else if (typeof searchParams.exactMatch === 'boolean') {
        exactMatch = searchParams.exactMatch;
      }
    }
    
    let query: any = {};
    if (searchContent) {
      if (exactMatch) {
        // 精准搜索：精确匹配
        if (searchSelect === 'id') {
          query.id = searchContent;
        } else if (searchSelect === 'zh-CN') {
          // 搜索source字段，因为zh-CN的内容存储在source中
          query.source = searchContent;
        } else if (searchSelect === 'en-US') {
          query['target.en-US'] = searchContent;
        } else if (searchSelect === 'zh-HK') {
          query['target.zh-HK'] = searchContent;
        }
      } else {
        // 模糊搜索：使用正则表达式
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

  // 批量导入
  async batchImport(fileBuffer: Buffer, fileName: string = ''): Promise<{ code: number; data: any; message: string }> {
    let parsedData: any;
    
    // 只接受Excel文件
    if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
      throw new Error('只支持Excel文件(.xlsx/.xls)');
    }
    
    // 处理Excel文件
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    
    const worksheet = workbook.getWorksheet(1); // 获取第一个工作表
    if (!worksheet) {
      throw new Error('Excel文件中没有找到工作表');
    }
    
    // 获取表头
    const headers: any[] = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value;
    });
    
    // 转换为数据结构
    const data: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value || '';
        }
      });
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });
    
    parsedData = { data, errors: [] };

    if (parsedData.errors.length > 0) {
      throw new Error('文件格式错误');
    }

    const results = {
      data: [] as any[],
      total: 0,
      success: 0,
      errors: [] as Array<{ row: number; message: string }>,
      hasDuplicates: false // 标记是否存在重复问题
    };

    // 获取现有翻译项用于去重检查
    const existingTranslations = await Translation.find();
    const existingSources = new Set(existingTranslations.map(item => item.source));
    const internalSet = new Set(); // 检查Excel内部重复

    // 第一步：验证所有数据，检查是否有重复问题
    const validData: any[] = [];
    let hasDuplicateIssues = false;

    for (let i = 0; i < parsedData.data.length; i++) {
      const row = parsedData.data[i];
      results.total++;

      const cellValue = row.Source || row['翻译项'];

      // 检查必填字段
      if (!cellValue || (typeof cellValue === 'string' && cellValue.trim() === '')) {
        results.errors.push({
          row: i + 2,
          message: '翻译项不能为空'
        });
        hasDuplicateIssues = true;
        continue;
      }

      // 1. 检查Excel内部重复
      if (internalSet.has(cellValue)) {
        results.errors.push({
          row: i + 2,
          message: 'Excel内部重复：该翻译项在表格中已存在'
        });
        hasDuplicateIssues = true;
        continue;
      }
      internalSet.add(cellValue);

      // 2. 检查数据库中是否已存在
      if (existingSources.has(cellValue)) {
        results.errors.push({
          row: i + 2,
          message: '数据库中已存在：该翻译项在数据库中已存在'
        });
        hasDuplicateIssues = true;
        continue;
      }

      // 数据验证通过，添加到有效数据列表
      validData.push({
        rowIndex: i + 2,
        data: {
          source: cellValue,
          'en-US': row['翻译项-英文'] || row['target(en-US)'] || '',
          'zh-HK': row['翻译项-繁体'] || row['target(zh-HK)'] || ''
        }
      });
    }

    // 第二步：如果存在重复问题，不保存任何数据
    if (hasDuplicateIssues) {
      results.hasDuplicates = true;
      return {
        code: 200,
        data: results,
        message: `检测到重复问题，已阻止数据导入。共 ${results.total} 条数据，发现 ${results.errors.length} 个问题，请修正后重新导入。`
      };
    }

    // 第三步：如果没有重复问题，批量保存所有有效数据
    try {
      for (const item of validData) {
        try {
          // 自动生成新ID
          const id = await this.generateNewId();

          const translation = new Translation({
            id,
            source: item.data.source,
            target: {
              'zh-CN': item.data.source,
              'en-US': item.data['en-US'],
              'zh-HK': item.data['zh-HK']
            }
          });

          // 保存到数据库
          await translation.save();
          
          results.data.push(translation);
          results.success++;
        } catch (error) {
          results.errors.push({
            row: item.rowIndex,
            message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
          });
        }
      }
    } catch (error) {
      throw new Error(`批量保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return {
      code: 200,
      data: results,
      message: `导入成功！共 ${results.total} 条数据，成功导入 ${results.success} 条数据。`
    };
  }

  // 下载批量修改模板
  downloadUpdateTemplate(): ExcelJS.Workbook {
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
  async batchUpdate(fileBuffer: Buffer, fileName: string = ''): Promise<{ code: number; data: any; message: string }> {
    let parsedData: any;
    
    // 只接受Excel文件
    if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
      throw new Error('只支持Excel文件(.xlsx/.xls)');
    }
    
    // 处理Excel文件
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    
    const worksheet = workbook.getWorksheet(1); // 获取第一个工作表
    if (!worksheet) {
      throw new Error('Excel文件中没有找到工作表');
    }
    
    // 获取表头
    const headers: any[] = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value;
    });
    
    // 转换为数据结构
    const data: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value || '';
        }
      });
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });
    
    parsedData = { data, errors: [] };

    if (parsedData.errors.length > 0) {
      throw new Error('文件格式错误');
    }

    const results = {
      total: 0,
      success: 0,
      errors: [] as Array<{ row: number; message: string }>
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
          message: error instanceof Error ? error.message : '未知错误'
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
  async batchGetIds(fileBuffer: Buffer, fileName: string = ''): Promise<{ code: number; data: any; message: string }> {
    let parsedData: any;
    
    // 只接受Excel文件
    if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
      throw new Error('只支持Excel文件(.xlsx/.xls)');
    }
    
    // 处理Excel文件
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    
    const worksheet = workbook.getWorksheet(1); // 获取第一个工作表
    if (!worksheet) {
      throw new Error('Excel文件中没有找到工作表');
    }
    
    // 获取表头
    const headers: any[] = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value;
    });
    
    // 转换为数据结构
    const data: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value || '';
        }
      });
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });
    
    parsedData = { data, errors: [] };

    if (parsedData.errors.length > 0) {
      throw new Error('文件格式错误');
    }

    const results = {
      total: 0,
      success: 0,
      errors: [] as Array<{ row: number; message: string }>,
      data: [] as any[]
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
            message: `翻译项在数据库中不存在`
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
          message: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return {
      code: 200,
      data: results,
      message: `批量获取 ${results.total} 条数据，成功获取 ${results.success} 条翻译项ID，失败获取 ${results.errors.length} 条翻译项ID`
    };
  }

  // 下载批量获取ID模板
  downloadGetIdsTemplate(): ExcelJS.Workbook {
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
  async exportGetIdsResult(data: any[]): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    // 禁用一些功能以提升性能
    const worksheet = workbook.addWorksheet('翻译项ID结果', {
      properties: {
        defaultRowHeight: 15
      },
      views: [{ showGridLines: false }]
    });
    
    // 设置表头
    worksheet.columns = [
      { header: "翻译项ID", key: "id", width: 20 },
      { header: "翻译项", key: "zh-CN", width: 30 },
      { header: "翻译项-英文", key: "en-US", width: 30 },
      { header: "翻译项-繁体", key: "zh-HK", width: 30 },
    ];
    
    // 批量准备数据，提高性能
    const rows = data.map(item => [
      item.id || '',
      item.source || '',
      item['en-US'] || '',
      item['zh-HK'] || ''
    ]);
    
    // 批量添加行（比逐个添加更高效）
    worksheet.addRows(rows);
    
    // 设置表头样式
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    return workbook;
  }

  // 下载批量删除模板
  downloadDeleteTemplate(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('批量删除模板');
    
    // 设置表头 - 包含所有列，但只有翻译项ID是必传的
    worksheet.columns = [
      { header: "翻译项ID", key: "id", width: 20 },
      { header: "翻译项", key: "source", width: 30 },
      { header: "翻译项-英文", key: "en-US", width: 30 },
      { header: "翻译项-繁体", key: "zh-HK", width: 30 },
    ];
    
    return workbook;
  }

  // 批量删除
  async batchDelete(fileBuffer: Buffer, fileName: string = ''): Promise<{ code: number; data: any; message: string }> {
    let parsedData: any;
    
    // 只接受Excel文件
    if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
      throw new Error('只支持Excel文件(.xlsx/.xls)');
    }
    
    // 处理Excel文件
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    
    const worksheet = workbook.getWorksheet(1); // 获取第一个工作表
    if (!worksheet) {
      throw new Error('Excel文件中没有找到工作表');
    }
    
    // 获取表头
    const headers: any[] = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value;
    });
    
    // 转换为数据结构
    const data: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头
      
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value || '';
        }
      });
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });
    
    parsedData = { data, errors: [] };

    if (parsedData.errors.length > 0) {
      throw new Error('文件格式错误');
    }

    const results = {
      total: 0,
      success: 0,
      errors: [] as Array<{ row: number; message: string }>
    };

    // 获取所有现有翻译项的ID用于验证
    const existingTranslations = await Translation.find();
    const existingIds = new Set(existingTranslations.map(item => item.id));

    for (let i = 0; i < parsedData.data.length; i++) {
      const row = parsedData.data[i];
      results.total++;

      const translationId = row.ID || row['翻译项ID'] || row.id;

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
        // 执行删除
        const deletedTranslation = await Translation.findOneAndDelete({ id: translationId });

        if (!deletedTranslation) {
          throw new Error('删除失败');
        }

        results.success++;
      } catch (error) {
        results.errors.push({
          row: i + 2,
          message: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return {
      code: 200,
      data: results,
      message: `批量删除 ${results.total} 条数据，成功删除 ${results.success} 条数据，失败 ${results.errors.length} 条数据`
    };
  }
}

export default new TranslationService();
