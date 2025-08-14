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
    if (!token) {
      return null; // 返回null而不是抛出错误
    }

    // 检查token是否即将过期
    if (this.isTokenExpiringSoon(token)) {
      try {
        const tokenData = await this.refreshToken();
        return tokenData.token;
      } catch (error) {
        // 刷新失败，清除所有token并跳转到登录页
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('token刷新失败，请重新登录');
      }
    }

    return token;
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;
