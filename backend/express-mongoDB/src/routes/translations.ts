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
router.delete('/deleteBing/:id', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      const response: IApiResponse = {
        status: 400,
        message: '翻译项ID不能为空',
        data: ''
      };
      return res.status(400).json(response);
    }
    
    const result = await translationService.delete(id);
    const response: IApiResponse = {
      status: 200,
      message: '删除成功',
      data: result
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '删除失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

// 导出JSON数据
router.get('/exportBing', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { langType } = req.query;
    const result = await translationService.exportJsonData(langType as 'zh-CN' | 'en-US' | 'zh-HK');
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    
    const fs = require('fs');
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    fileStream.on('end', () => {
      result.done(); // 清理临时文件
    });
    
    fileStream.on('error', (error: Error) => {
      console.error('文件流错误:', error);
      result.done(); // 清理临时文件
    });
    
    return;
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '导出失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

// 导出Excel数据
router.get('/exportExcel', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { includeId } = req.query;
    const workbook = await translationService.exportExcelData(includeId === 'true');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="translations.xlsx"');
    
    await workbook.xlsx.write(res);
    return;
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '导出失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

// 下载模板
router.get('/downloadTemplate', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const workbook = translationService.downloadTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="translation_template.xlsx"');
    
    await workbook.xlsx.write(res);
    return;
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '下载失败',
      data: ''
    };
    return res.status(400).json(response);
  }
});

export default router;
