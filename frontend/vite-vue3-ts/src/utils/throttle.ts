/**
 * 节流函数 (Throttle)
 * 节流：在一定时间内，多次触发同一个函数，按照固定的时间间隔执行
 * 适用场景：滚动事件、按钮点击、鼠标移动等
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    // 如果距离上次执行的时间超过了延迟时间，则执行函数
    if (currentTime - lastExecTime >= delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    }
  };
}

/**
 * 带取消功能的节流函数
 */
export function throttleWithCancel<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): {
  throttled: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let lastExecTime = 0;
  let timeoutId: number | null = null;
  
  const throttled = (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime >= delay) {
      // 立即执行
      func.apply(null, args);
      lastExecTime = currentTime;
    } else {
      // 如果还在节流期间，设置延迟执行
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  };
  
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastExecTime = 0;
  };
  
  return { throttled, cancel };
}

/**
 * 立即执行的节流函数（第一次调用立即执行）
 */
export function throttleImmediate<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecTime = 0;
  let isFirstCall = true;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (isFirstCall || currentTime - lastExecTime >= delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
      isFirstCall = false;
    }
  };
}

/**
 * 尾调用的节流函数（最后一次调用会在延迟后执行）
 */
export function throttleTrailing<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecTime = 0;
  let timeoutId: number | null = null;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime >= delay) {
      // 立即执行
      func.apply(null, args);
      lastExecTime = currentTime;
      timeoutId = null;
    } else {
      // 清除之前的延迟执行
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // 设置延迟执行，确保最后一次调用会被执行
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay);
    }
  };
}
