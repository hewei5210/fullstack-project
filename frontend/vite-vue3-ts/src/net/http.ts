import axios from "axios";
// AxiosRequestConfig和InternalAxiosRequestConfig的区别：
// AxiosRequestConfig：属性可选，灵活  InternalAxiosRequestConfig：属性必选，严格
// 在封装 HTTP 工具时，用户暴露的方法参数类型应始终使用 AxiosRequestConfig，仅在拦截器等内部逻辑中使用 InternalAxiosRequestConfig。
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ElMessage } from "element-plus";
import tokenManager from "../utils/tokenManager";

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: "http://localhost:3000", // 直接使用后端地址
  withCredentials: true,
  timeout: 10000, // 请求超时时间
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
  },
});

// 请求拦截器
service.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 对于登录和刷新token的请求，不需要添加Authorization头
    if (config.url?.includes('/login') || config.url?.includes('/refresh')) {
      return config;
    }

    try {
      // 获取有效的token（如果即将过期则自动刷新）
      const token = await tokenManager.getValidToken();
      if (token) {
        config.headers!.Authorization = `Bearer ${token}`;
      }
      // 如果没有token，不添加Authorization头，让响应拦截器处理401错误
    } catch (error) {
      console.error('Token获取失败:', error);
      // 不在这里清除token和跳转，让响应拦截器处理
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是401错误且不是刷新token的请求，尝试刷新token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/refresh')) {
      originalRequest._retry = true;
      
      try {
        // 检查是否有refreshToken
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          // 尝试刷新token
          await tokenManager.refreshToken();
          
          // 重新发送原始请求
          const newToken = await tokenManager.getValidToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return service(originalRequest);
          }
        }
        
        // 没有refreshToken或刷新失败，清除token并跳转到登录页
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        console.error('Token刷新失败:', refreshError);
        // 刷新失败，清除token并跳转到登录页
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // 只在以下情况下显示错误消息，避免与组件中的错误处理重复：
    // 1. 网络错误（无response）
    // 2. 服务器错误（5xx）
    // 3. 其他非业务错误
    if (!error.response || error.response.status >= 500) {
      console.error("HTTP Error:", error);
      const message = error.response?.data?.message || error.message || "网络请求失败";
      ElMessage.error(message);
    }
    
    return Promise.reject(error);
  }
);

// 封装通用请求方法
export const http = {
  get<T = any>(
    url: string,
    params?: Record<string, any> | null,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return service.get(url, { ...config, params });
  },

  post<T = any>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return service.post(url, data, config);
  },

  put<T = any>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return service.put(url, data, config);
  },

  delete<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return service.delete(url, { ...config, params });
  },
};

export default service;
