/**
 * 防抖函数 (Debounce)
 * 防抖：在一定时间内，多次触发同一个函数，只执行最后一次
 * 适用场景：搜索框输入、窗口大小调整、表单提交等
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  
  return (...args: Parameters<T>) => {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // 设置新的定时器
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

/**
 * 带取消功能的防抖函数
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeoutId: number | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
  
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return { debounced, cancel };
}
