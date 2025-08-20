import tokenManager from './tokenManager';

class AutoRefreshManager {
  private refreshTimer: number | null = null;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5分钟检查一次

  // 启动自动刷新
  start() {
    if (this.refreshTimer) {
      this.stop();
    }

    this.refreshTimer = setInterval(async () => {
      try {
        const token = tokenManager.getToken();
        if (token && tokenManager.isTokenExpiringSoon(token)) {
          console.log('Token即将过期，自动刷新...');
          await tokenManager.refreshToken();
          console.log('Token自动刷新成功');
        }
      } catch (error) {
        console.error('Token自动刷新失败:', error);
        // 刷新失败时清除token并跳转到登录页
        tokenManager.clearTokens();
        // 只有在当前页面不是登录页时才跳转
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }, this.REFRESH_INTERVAL);
  }

  // 停止自动刷新
  stop() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // 检查是否已启动
  isRunning(): boolean {
    return this.refreshTimer !== null;
  }
}

export const autoRefreshManager = new AutoRefreshManager();
export default autoRefreshManager;
