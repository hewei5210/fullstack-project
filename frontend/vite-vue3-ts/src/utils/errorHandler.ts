import { ElMessage } from 'element-plus';

interface ErrorResponse {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

/**
 * 统一的错误处理函数
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 * @param showMessage 是否显示错误消息
 */
export function handleError(
  error: ErrorResponse, 
  defaultMessage: string = '操作失败',
  showMessage: boolean = true
): void {
  // 业务错误（4xx状态码）
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    const errorMessage = error.response?.data?.message || defaultMessage;
    if (showMessage) {
      ElMessage.error(errorMessage);
    }
    return;
  }
  
  // 其他错误（网络错误、服务器错误等）由HTTP拦截器处理
  // 这里不显示消息，避免重复
}

/**
 * 检查是否为业务错误
 * @param error 错误对象
 * @returns 是否为业务错误
 */
export function isBusinessError(error: ErrorResponse): boolean {
  return !!(error.response && error.response.status >= 400 && error.response.status < 500);
}

/**
 * 检查是否为网络错误
 * @param error 错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: ErrorResponse): boolean {
  return !error.response || error.response.status >= 500;
}
