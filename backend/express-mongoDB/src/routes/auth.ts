import express, { Request, Response } from 'express';
import authService from '../services/authService';
import { ILoginRequest, IRefreshTokenRequest, IApiResponse } from '../types';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body as ILoginRequest);
    const response: IApiResponse = {
      status: 200,
      message: 'success',
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '认证失败',
      data: ''
    };
    res.status(400).json(response);
  }
});

// 刷新token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as IRefreshTokenRequest;
    if (!refreshToken) {
      const response: IApiResponse = {
        status: 400,
        message: '刷新token不能为空',
        data: ''
      };
      return res.status(400).json(response);
    }

    const result = await authService.refreshToken(refreshToken);
    const response: IApiResponse = {
      status: 200,
      message: 'token刷新成功',
      data: result
    };
    res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 400,
      message: error instanceof Error ? error.message : '刷新失败',
      data: ''
    };
    res.status(400).json(response);
  }
});

export default router;
