const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csvSyncService = require('../services/csvSyncService');
const auth = require('../middleware/auth');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只允许CSV文件
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传CSV文件'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

/**
 * @route POST /api/csv-sync/upload
 * @desc 上传CSV文件并同步到MongoDB
 * @access Private
 */
router.post('/upload', auth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择CSV文件' });
    }

    const options = {
      skipDuplicates: req.body.skipDuplicates === 'true',
      updateExisting: req.body.updateExisting === 'true',
      batchSize: parseInt(req.body.batchSize) || 1000
    };

    const result = await csvSyncService.syncCsvToMongoDB(req.file.path, options);

    // 删除临时文件
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('CSV上传同步失败:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'CSV同步失败'
    });
  }
});

/**
 * @route POST /api/csv-sync/sync-file
 * @desc 同步指定路径的CSV文件
 * @access Private
 */
router.post('/sync-file', auth, async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, message: '请提供CSV文件路径' });
    }

    const syncOptions = {
      skipDuplicates: options.skipDuplicates !== false,
      updateExisting: options.updateExisting !== false,
      batchSize: parseInt(options.batchSize) || 1000
    };

    const result = await csvSyncService.syncCsvToMongoDB(filePath, syncOptions);

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('CSV文件同步失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'CSV同步失败'
    });
  }
});

/**
 * @route GET /api/csv-sync/export
 * @desc 从MongoDB导出数据到CSV
 * @access Private
 */
router.get('/export', auth, async (req, res) => {
  try {
    const { filter = {}, filename } = req.query;
    
    // 解析过滤条件
    let parsedFilter = {};
    if (filter) {
      try {
        parsedFilter = JSON.parse(filter);
      } catch (e) {
        console.warn('过滤条件解析失败，使用空对象');
      }
    }

    // 生成输出文件名
    const outputFilename = filename || `translations_${Date.now()}.csv`;
    const outputPath = path.join(__dirname, '../../exports', outputFilename);

    // 确保导出目录存在
    const exportDir = path.dirname(outputPath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const result = await csvSyncService.exportToCsv(outputPath, parsedFilter);

    // 设置响应头，让浏览器下载文件
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    // 发送文件
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('文件发送失败:', err);
      }
      // 删除临时文件
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    });

  } catch (error) {
    console.error('CSV导出失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'CSV导出失败'
    });
  }
});

/**
 * @route GET /api/csv-sync/stats
 * @desc 获取同步统计信息
 * @access Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await csvSyncService.getSyncStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取统计信息失败'
    });
  }
});

/**
 * @route POST /api/csv-sync/clean-duplicates
 * @desc 清理重复数据
 * @access Private
 */
router.post('/clean-duplicates', auth, async (req, res) => {
  try {
    const result = await csvSyncService.cleanDuplicates();
    
    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('清理重复数据失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '清理重复数据失败'
    });
  }
});

/**
 * @route GET /api/csv-sync/validate
 * @desc 验证CSV文件格式
 * @access Private
 */
router.post('/validate', auth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择CSV文件' });
    }

    const csvContent = fs.readFileSync(req.file.path, 'utf-8');
    const Papa = require('papaparse');
    
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      trimValues: true
    });

    // 删除临时文件
    fs.unlinkSync(req.file.path);

    const validation = {
      totalRows: parseResult.data.length,
      errors: parseResult.errors,
      headers: parseResult.meta.fields || [],
      isValid: parseResult.errors.length === 0,
      sampleData: parseResult.data.slice(0, 5) // 前5行作为示例
    };

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('CSV验证失败:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'CSV验证失败'
    });
  }
});

module.exports = router;
