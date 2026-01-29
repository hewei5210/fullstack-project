import express, { Request, Response } from 'express';
import translationService from '../services/translationService';
import authMiddleware from '../middleware/auth';
import multer from 'multer';
import { IAuthenticatedRequest, IApiResponse } from '../types';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 应用认证中间件
router.use(authMiddleware);

// 获取翻译列表
router.get('/getBingList', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const result = await translationService.getList(req.query);
    const response: IApiResponse = {
      status: 200,
      message: 'success',
      data: result
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '获取失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

// 搜索翻译项
router.get('/search', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const result = await translationService.search(req.query);
    const response: IApiResponse = {
      status: 200,
      message: 'success',
      data: result
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '搜索失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

// 添加翻译项
router.post('/addBing', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const result = await translationService.add(req.body);
    const response: IApiResponse = {
      status: 200,
      message: '添加成功',
      data: result
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '添加失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

// 更新翻译项
router.put('/updateBing', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const result = await translationService.update(req.body);
    const response: IApiResponse = {
      status: 200,
      message: '更新成功',
      data: result
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '更新失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

// 删除翻译项
router.delete('/delBing', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        status: 400,
        message: '翻译项ID不能为空',
        data: ''
      });
    }
    
    const result = await translationService.delete(id as string);
    return res.status(200).json({
      status: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '删除失败',
      data: ''
    });
  }
});

// 导出JSON数据
router.get('/exportBing', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { langType = 'zh-CN' } = req.query;
    
    const fileInfo = await translationService.exportJsonData(langType as 'zh-CN' | 'en-US' | 'zh-HK');
    
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
    
    return;
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '导出失败',
      data: ''
    });
  }
});

// 导出Excel数据
router.get('/exportExcel', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { includeId = false } = req.query;
    
    const workbook = await translationService.exportExcelData(includeId === 'true');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=translation_data.xlsx');
    
    await workbook.xlsx.write(res);
    return;
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '导出失败',
      data: ''
    });
  }
});

// 下载模板
router.get('/downloadTemplate', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const workbook = translationService.downloadTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=translation_template.xlsx');
    
    await workbook.xlsx.write(res);
    return;
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '下载失败',
      data: ''
    });
  }
});

// 批量上传翻译项
router.post('/batchUpload', upload.single('file'), async (req: IAuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: '请上传文件',
        data: ''
      });
    }

    const result = await translationService.batchImport(req.file.buffer, req.file.originalname);
    
    // 根据结果代码返回相应的状态码
    const statusCode = result.code === 200 ? 200 : 400;
    
    return res.status(statusCode).json({
      status: result.code,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '批量上传失败',
      data: ''
    });
  }
});

// 批量修改
router.post('/batchUpdate', upload.single('file'), async (req: IAuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: '请上传文件',
        data: ''
      });
    }

    const result = await translationService.batchUpdate(req.file.buffer, req.file.originalname);
    return res.status(200).json({
      status: 200,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '批量修改失败',
      data: ''
    });
  }
});

// 批量获取翻译项ID
router.post('/batchGetIds', upload.single('file'), async (req: IAuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: '请上传文件',
        data: ''
      });
    }

    const result = await translationService.batchGetIds(req.file.buffer, req.file.originalname);
    return res.status(200).json({
      status: 200,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '批量获取ID失败',
      data: ''
    });
  }
});

// 导出批量获取ID结果
router.post('/exportGetIdsResult', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        status: 400,
        message: '数据格式错误',
        data: ''
      });
    }

    // 检查数据量，如果太大给出提示
    if (data.length > 10000) {
      return res.status(400).json({
        status: 400,
        message: `数据量过大（${data.length}条），请分批导出，每次最多10000条`,
        data: ''
      });
    }

    console.log(`开始导出 ${data.length} 条数据的Excel文件...`);
    const workbook = await translationService.exportGetIdsResult(data);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=translation_ids_result.xlsx');
    
    // 使用流式写入，避免内存问题
    await workbook.xlsx.write(res);
    console.log(`Excel文件导出成功，共 ${data.length} 条数据`);
    return;
  } catch (error) {
    console.error('导出Excel文件失败:', error);
    // 返回500状态码，因为这是服务器内部错误
    return res.status(500).json({
      status: 500,
      message: error instanceof Error ? error.message : '服务器内部错误',
      data: ''
    });
  }
});

// 下载批量修改模板
router.get('/downloadUpdateTemplate', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const workbook = translationService.downloadUpdateTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=translation_update_template.xlsx');
    
    await workbook.xlsx.write(res);
    return;
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '下载失败',
      data: ''
    });
  }
});

// 下载批量获取ID模板
router.get('/downloadGetIdsTemplate', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const workbook = translationService.downloadGetIdsTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=translation_get_ids_template.xlsx');
    
    await workbook.xlsx.write(res);
    return;
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '下载失败',
      data: ''
    });
  }
});

// 批量删除
router.post('/batchDelete', upload.single('file'), async (req: IAuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: '请上传文件',
        data: ''
      });
    }

    const result = await translationService.batchDelete(req.file.buffer, req.file.originalname);
    return res.status(200).json({
      status: 200,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '批量删除失败',
      data: ''
    });
  }
});

// 下载批量删除模板
router.get('/downloadDeleteTemplate', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const workbook = translationService.downloadDeleteTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=translation_delete_template.xlsx');
    
    await workbook.xlsx.write(res);
    return;
  } catch (error) {
    return res.status(400).json({
      status: 400,
      message: error instanceof Error ? error.message : '下载失败',
      data: ''
    });
  }
});

export default router;
