import { http } from '../net/http';

interface TokenData {
  token: string;
  refreshToken: string;
  user: any;
}

class TokenManager {
  private refreshPromise: Promise<TokenData> | null = null;

  // 存储token
  setTokens(tokenData: TokenData) {
    localStorage.setItem('token', tokenData.token);
    localStorage.setItem('refreshToken', tokenData.refreshToken);
    // 确保用户信息不为空再存储
    if (tokenData.user) {
      localStorage.setItem('user', JSON.stringify(tokenData.user));
    } else {
      localStorage.removeItem('user');
    }
  }

  // 获取访问token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 获取刷新token
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // 获取用户信息
  getUser(): any {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  }

  // 清除所有token
  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // 检查token是否即将过期
  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;
      
      // 如果token在5分钟内过期，则返回true
      return expiresIn <= 300; // 5分钟 = 300秒
    } catch (error) {
      return false;
    }
  }

  // 刷新token
  async refreshToken(): Promise<TokenData> {
    // 如果已经有刷新请求在进行中，直接返回该请求
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('没有刷新token');
    }

    // 创建新的刷新请求
    this.refreshPromise = http.post('/api/refresh', { refreshToken })
      .then((response: any) => {
        const tokenData: TokenData = {
          token: response.data.token,
          refreshToken: refreshToken, // 刷新token保持不变
          user: response.data.user
        };
        
        // 更新存储的token
        this.setTokens(tokenData);
        return tokenData;
      })
      .finally(() => {
        // 清除刷新请求引用
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  // 获取有效的token（如果即将过期则自动刷新）
  async getValidToken(): Promise<string | null> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (!token) {
      return null;
    }

    // 检查token是否即将过期或已过期
    if (this.isTokenExpiringSoon(token) || this.isTokenExpired(token)) {
      // 如果有refreshToken，尝试刷新
      if (refreshToken) {
        try {
          const tokenData = await this.refreshToken();
          return tokenData.token;
        } catch (error) {
          console.error('Token刷新失败:', error);
          // 刷新失败，清除所有token
          this.clearTokens();
          return null;
        }
      } else {
        // 没有refreshToken，清除token
        this.clearTokens();
        return null;
      }
    }

    return token;
  }

  // 检查token是否已过期
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      return true; // 解析失败认为已过期
    }
  }

  // 检查token状态（用于调试）
  getTokenStatus() {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (!token && !refreshToken) {
      return { status: 'no_tokens', message: '没有token和refreshToken' };
    }
    
    if (!token && refreshToken) {
      return { status: 'no_token_has_refresh', message: '没有token但有refreshToken' };
    }
    
    if (token && !refreshToken) {
      return { status: 'has_token_no_refresh', message: '有token但没有refreshToken' };
    }
    
    if (token && refreshToken) {
      if (this.isTokenExpired(token)) {
        return { status: 'token_expired_has_refresh', message: 'token已过期但有refreshToken' };
      }
      if (this.isTokenExpiringSoon(token)) {
        return { status: 'token_expiring_soon', message: 'token即将过期' };
      }
      return { status: 'valid', message: 'token有效' };
    }
    
    return { status: 'unknown', message: '未知状态' };
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;
