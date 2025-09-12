import express, { Response } from 'express';
import authMiddleware from '../middleware/auth';
import { IAuthenticatedRequest, IApiResponse } from '../types';

const router = express.Router();

// 应用认证中间件
router.use(authMiddleware);

// CSV同步接口（占位符）
router.post('/sync', async (req: IAuthenticatedRequest, res: Response) => {
  try {
    // TODO: 实现CSV同步逻辑
    const response: IApiResponse = {
      status: 200,
      message: 'CSV同步功能待实现',
      data: {}
    };
    res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : 'CSV同步失败',
      data: ''
    };
    res.status(400).json(response);
  }
});

export default router;
