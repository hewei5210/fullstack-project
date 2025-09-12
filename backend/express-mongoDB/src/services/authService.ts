import User from '../models/User';
import jwt from 'jsonwebtoken';
import { ILoginRequest, ILoginResponse, IRefreshTokenRequest, IRefreshTokenResponse, IJwtPayload } from '../types';

const SECRET_KEY = process.env.JWT_SECRET || 'your_ultra_secure_secret';
const TOKEN_EXPIRES = '2h';
const REFRESH_TOKEN_EXPIRES = '7d'; // 刷新token有效期7天

class AuthService {
  async login(credentials: ILoginRequest): Promise<ILoginResponse> {
    const { username, password } = credentials;
    
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }
    
    // 生成访问token和刷新token
    const accessToken = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: TOKEN_EXPIRES }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id, type: 'refresh' },
      SECRET_KEY,
      { expiresIn: REFRESH_TOKEN_EXPIRES }
    );
    
    return {
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    };
  }

  verifyToken(token: string): IJwtPayload {
    try {
      return jwt.verify(token, SECRET_KEY) as IJwtPayload;
    } catch (error) {
      throw new Error('Token无效');
    }
  }

  // 刷新token
  async refreshToken(refreshToken: string): Promise<IRefreshTokenResponse> {
    try {
      const decoded = jwt.verify(refreshToken, SECRET_KEY) as any;
      
      // 检查是否是刷新token
      if (decoded.type !== 'refresh') {
        throw new Error('无效的刷新token');
      }
      
      // 获取用户信息
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 生成新的访问token和刷新token
      const newAccessToken = jwt.sign(
        { userId: user._id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: TOKEN_EXPIRES }
      );
      
      const newRefreshToken = jwt.sign(
        { userId: user._id, type: 'refresh' },
        SECRET_KEY,
        { expiresIn: REFRESH_TOKEN_EXPIRES }
      );
      
      return {
        token: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('刷新token失败');
    }
  }

  // 检查token是否即将过期（提前5分钟刷新）
  isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return false;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      
      // 如果token在5分钟内过期，则返回true
      return expiresIn <= 300; // 5分钟 = 300秒
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();
