import { Response, NextFunction } from 'express';
import authService from '../services/authService';
import { IAuthenticatedRequest } from '../types';

const authMiddleware = (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 401,
        message: '未提供认证令牌'
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (error) {
    res.status(401).json({
      status: 401,
      message: '认证失败'
    });
  }
};

export default authMiddleware;
