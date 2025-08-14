const express = require('express');
const router = express.Router();
const translationService = require('../services/translationService');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// 应用认证中间件
router.use(authMiddleware);

// 获取翻译列表
router.get('/getBingList', async (req, res) => {
  try {
    const result = await translationService.getList(req.query);
    res.status(200).json({
      status: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

// 搜索翻译项
router.get('/search', async (req, res) => {
  try {
    const result = await translationService.search(req.query);
    res.status(200).json({
      status: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

// 添加翻译项
router.post('/addBing', async (req, res) => {
  try {
    const result = await translationService.add(req.body);
    res.status(200).json({
      status: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

// 更新翻译项
router.put('/updateBing', async (req, res) => {
  try {
    const result = await translationService.update(req.body);
    res.status(200).json({
      status: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

// 删除翻译项
router.delete('/delBing', async (req, res) => {
  try {
    const result = await translationService.delete(req.query.id);
    res.status(200).json({
      status: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

// 批量上传
router.post('/batchUpload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: '请上传文件',
        data: ''
      });
    }

    const result = await translationService.batchImport(req.file.buffer);
    res.status(200).json({
      status: 200,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

// 导出数据
router.get('/exportBing', async (req, res) => {
  try {
    const { langType = 'zh-CN' } = req.query;
    
    const fileInfo = await translationService.exportJsonData(langType);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(fileInfo.filePath)) {
      throw new Error('导出文件不存在');
    }
    
    // 读取文件内容
    const fileContent = fs.readFileSync(fileInfo.filePath, 'utf8');
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
    res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // 发送文件内容
    res.send(fileContent);
    
    
    // 清理临时文件
    setTimeout(() => {
      try {
        fileInfo.done();
      } catch (error) {
        console.error('清理临时文件失败:', error);
      }
    }, 2000); // 增加延迟时间
    
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

// 下载模板
router.get('/downloadTemplate', async (req, res) => {
  try {
    const workbook = await translationService.downloadTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=translation_template.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

module.exports = router;
