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

// 创建环境变量配置
// 如何在本地环境，vite会读取.env.development配置文件
// 如果是生产环境，vite会读取.env.production配置文件
const BASE_URL = import.meta.env.VITE_APP_API_BASE;

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
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

    // 开发环境代理配置（vue.config.js）
    if (import.meta.env.NODE_ENV === "development") {
      config.url = `/api${config.url}`;
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
    const res = response;
    // 根据业务状态码处理（示例）
    // if (res.status !== 200) {
    //   ElMessage.error(res.message || "Error");
    //   return Promise.reject(new Error(res.message || "Error"));
    // }
    return res;
  },
  (error) => {
    ElMessage.error(error.response.data.message);
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
