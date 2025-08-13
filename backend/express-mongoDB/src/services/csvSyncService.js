const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const Translation = require('../models/Translation');

class CsvSyncService {
  /**
   * 同步CSV文件到MongoDB
   * @param {string} csvFilePath - CSV文件路径
   * @param {Object} options - 同步选项
   * @returns {Promise<Object>} 同步结果
   */
  async syncCsvToMongoDB(csvFilePath, options = {}) {
    const {
      skipDuplicates = true,
      updateExisting = true,
      batchSize = 1000,
      onProgress = null
    } = options;

    try {
      // 检查文件是否存在
      if (!fs.existsSync(csvFilePath)) {
        throw new Error(`CSV文件不存在: ${csvFilePath}`);
      }

      // 读取CSV文件
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      
      // 解析CSV
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        trimValues: true
      });

      if (parseResult.errors.length > 0) {
        console.warn('CSV解析警告:', parseResult.errors);
      }

      const records = parseResult.data;
      console.log(`CSV文件包含 ${records.length} 条记录`);

      // 统计数据
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      // 批量处理
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            // 验证必要字段
            if (!record.id || !record.Source) {
              console.warn(`跳过无效记录: ${JSON.stringify(record)}`);
              skipped++;
              continue;
            }

            // 构建翻译数据
            const translationData = {
              id: record.id,
              source: record.Source,
              target: {
                'zh-CN': record['target(zh-CN)'] || record.Source,
                'en-US': record['target(en-US)'] || record.Source,
                'zh-HK': record['target(zh-HK)'] || record.Source
              },
              status: 'ready'
            };

            // 检查是否已存在
            const existingRecord = await Translation.findOne({ id: record.id });

            if (existingRecord) {
              if (updateExisting) {
                // 更新现有记录
                await Translation.findOneAndUpdate(
                  { id: record.id },
                  translationData,
                  { new: true, runValidators: true }
                );
                updated++;
              } else if (skipDuplicates) {
                skipped++;
              } else {
                // 跳过重复记录
                skipped++;
              }
            } else {
              // 插入新记录
              await Translation.create(translationData);
              inserted++;
            }

          } catch (error) {
            console.error(`处理记录失败: ${record.id}`, error.message);
            errors++;
          }
        }

        // 进度回调
        if (onProgress) {
          const progress = Math.min(100, ((i + batch.length) / records.length) * 100);
          onProgress(progress, {
            processed: i + batch.length,
            total: records.length,
            inserted,
            updated,
            skipped,
            errors
          });
        }
      }

      const result = {
        success: true,
        total: records.length,
        inserted,
        updated,
        skipped,
        errors,
        message: `同步完成: 新增 ${inserted} 条，更新 ${updated} 条，跳过 ${skipped} 条，错误 ${errors} 条`
      };

      console.log(result.message);
      return result;

    } catch (error) {
      console.error('CSV同步失败:', error);
      throw error;
    }
  }

  /**
   * 从MongoDB导出数据到CSV
   * @param {string} outputPath - 输出文件路径
   * @param {Object} filter - 查询过滤条件
   * @returns {Promise<Object>} 导出结果
   */
  async exportToCsv(outputPath, filter = {}) {
    try {
      // 查询数据
      const translations = await Translation.find(filter).sort({ id: 1 });
      
      if (translations.length === 0) {
        throw new Error('没有找到要导出的数据');
      }

      // 构建CSV数据
      const csvData = translations.map(translation => ({
        id: translation.id,
        Source: translation.source,
        'target(zh-CN)': translation.target['zh-CN'],
        'target(en-US)': translation.target['en-US'],
        'target(zh-HK)': translation.target['zh-HK'],
        status: translation.status,
        createdAt: translation.createdAt,
        updatedAt: translation.updatedAt
      }));

      // 转换为CSV
      const csv = Papa.unparse(csvData);

      // 写入文件
      fs.writeFileSync(outputPath, csv, 'utf-8');

      const result = {
        success: true,
        exported: translations.length,
        filePath: outputPath,
        message: `成功导出 ${translations.length} 条记录到 ${outputPath}`
      };

      console.log(result.message);
      return result;

    } catch (error) {
      console.error('CSV导出失败:', error);
      throw error;
    }
  }

  /**
   * 获取同步状态统计
   * @returns {Promise<Object>} 统计信息
   */
  async getSyncStats() {
    try {
      const stats = await Translation.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await Translation.countDocuments();
      
      const statusMap = {
        ready: 0,
        pending: 0,
        error: 0
      };

      stats.forEach(stat => {
        statusMap[stat._id] = stat.count;
      });

      return {
        total,
        byStatus: statusMap,
        ready: statusMap.ready,
        pending: statusMap.pending,
        error: statusMap.error
      };

    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 清理重复数据
   * @returns {Promise<Object>} 清理结果
   */
  async cleanDuplicates() {
    try {
      const duplicates = await Translation.aggregate([
        {
          $group: {
            _id: '$id',
            count: { $sum: 1 },
            docs: { $push: '$_id' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      let deleted = 0;

      for (const duplicate of duplicates) {
        // 保留第一个，删除其余的
        const toDelete = duplicate.docs.slice(1);
        await Translation.deleteMany({ _id: { $in: toDelete } });
        deleted += toDelete.length;
      }

      return {
        success: true,
        duplicatesFound: duplicates.length,
        deleted,
        message: `清理完成: 发现 ${duplicates.length} 组重复数据，删除 ${deleted} 条记录`
      };

    } catch (error) {
      console.error('清理重复数据失败:', error);
      throw error;
    }
  }
}

module.exports = new CsvSyncService();
