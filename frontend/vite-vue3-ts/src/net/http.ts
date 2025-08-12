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
  (config: InternalAxiosRequestConfig) => {
    // 添加全局token（示例）
    const token = localStorage.getItem("token");
    if (token) {
      config.headers!.Authorization = `Bearer ${token}`;
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
  (error) => {
    console.error("HTTP Error:", error);
    const message = error.response?.data?.message || error.message || "请求失败";
    ElMessage.error(message);
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
