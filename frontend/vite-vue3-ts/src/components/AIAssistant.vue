<template>
  <!-- 悬浮按钮 - 不在登录页时显示 -->
  <div
    v-if="!isLoginPage"
    ref="buttonRef"
    class="ai-assistant-button"
    :class="{ 'is-open': dialogVisible, 'is-dragging': isDragging }"
    :style="buttonPosition"
    @mousedown="handleButtonDown"
    @click="handleButtonClick"
  >
    <div class="button-icon-wrapper">
      <img src="@/assets/ai-assistant-icon.png" alt="AI" class="button-icon" />
    </div>
    <div class="button-text">
      <div class="button-text-line">AI助理</div>
    </div>
  </div>

  <!-- 自定义对话框 -->
  <div
    v-if="computedDialogVisible"
    ref="dialogRef"
    class="ai-dialog-container"
    :class="{ 
      'is-fullscreen': isFullscreen, 
      'is-snapped': isSnapped,
      'is-dragging': isDraggingDialog
    }"
    :style="dialogStyle"
  >
    <!-- 对话框头部 -->
    <div
      class="ai-dialog-header"
      @mousedown="handleHeaderMouseDown"
    >
      <div class="ai-dialog-header-title">
        <span>AI助手</span>
      </div>
      <div class="ai-dialog-header-actions">
        <el-tooltip
          :content="isSnapped ? '窗口悬浮' : '窗口吸附'"
          placement="bottom"
          effect="dark"
          :append-to-body="true"
        >
          <el-button
            text
            size="small"
            @click="toggleSnap"
            class="header-action-btn"
            :class="{ 'is-active': isSnapped }"
          >
            <img
              :src="isSnapped ? windowFloatIconRef : windowAdhesionIconRef"
              alt="吸附"
              class="header-icon"
            />
          </el-button>
        </el-tooltip>
        <el-tooltip
          :content="isFullscreen ? '退出全屏' : '窗口全屏'"
          placement="bottom"
          effect="dark"
          :append-to-body="true"
        >
          <el-button
            text
            size="small"
            @click="toggleFullscreen"
            class="header-action-btn"
          >
            <img
              :src="isFullscreen ? fullscreenExitIconRef : fullscreenIconRef"
              alt="全屏"
              class="header-icon"
            />
          </el-button>
        </el-tooltip>
        <el-button
          text
          size="small"
          @click="closeDialog"
          title="关闭"
          class="header-action-btn"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 对话框内容 -->
    <div class="ai-dialog-body">
      <div ref="messagesContainerRef" class="ai-dialog-messages">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="ai-dialog-message"
          :class="`message-${message.role}`"
        >
          <div class="message-avatar">
            <el-icon v-if="message.role === 'user'">
              <UserFilled />
            </el-icon>
            <el-icon v-else>
              <Service />
            </el-icon>
          </div>
          <div class="message-content">
            <div
              class="message-text"
              v-html="formatMessage(message.content)"
            ></div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        <div v-if="loading" class="ai-dialog-message message-assistant">
          <div class="message-avatar">
            <el-icon><Service /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
      <div class="ai-dialog-input-area">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="3"
          placeholder="请输入您的问题..."
          @keydown.ctrl.enter="sendMessage"
          @keydown.meta.enter="sendMessage"
          :disabled="loading"
          resize="none"
          class="ai-dialog-textarea"
        />
        <div class="ai-dialog-actions">
          <el-button
            type="primary"
            @click="sendMessage"
            :loading="loading"
            :disabled="!userInput.trim()"
            size="small"
          >
            发送
          </el-button>
          <el-button
            @click="clearMessages"
            :disabled="loading || messages.length === 0"
            size="small"
          >
            清空
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { UserFilled, Service, Close } from "@element-plus/icons-vue";
import { callBailianAPI } from "@/utils/bailianAPI";
import { useDraggable } from "@vueuse/core";
// 导入自定义图标
import fullscreenIcon from "@/assets/fullscreen.svg";
import fullscreenExitIcon from "@/assets/fullscreen-exit.svg";
import windowAdhesionIcon from "@/assets/window-adhesion-icon.svg";
import windowFloatIcon from "@/assets/window-float-icon.svg";

const route = useRoute();

// 图标引用（用于模板）
const fullscreenIconRef = fullscreenIcon;
const fullscreenExitIconRef = fullscreenExitIcon;
const windowAdhesionIconRef = windowAdhesionIcon;
const windowFloatIconRef = windowFloatIcon;

// 判断是否在登录页
const isLoginPage = computed(() => {
  return route.path === "/login" || route.path === "/";
});

const dialogVisible = ref(false);
const userInput = ref("");
const messages = ref<
  Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
>([]);
const loading = ref(false);
const messagesContainerRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dialogRef = ref<HTMLElement | null>(null); // 用于模板引用

// 对话框状态
const isFullscreen = ref(false);
const isSnapped = ref(false); // 是否吸附到右侧
const dialogX = ref(0);
const dialogY = ref(0);
const dialogWidth = ref(460);
const dialogHeight = ref(600);

// 拖拽状态
let isDraggingDialog = false;
let dragStartX = 0;
let dragStartY = 0;
let dialogStartX = 0;
let dialogStartY = 0;

// 计算属性：只在非登录页时显示对话框
const computedDialogVisible = computed({
  get: () => {
    return !isLoginPage.value && dialogVisible.value;
  },
  set: (val: boolean) => {
    if (!isLoginPage.value) {
      dialogVisible.value = val;
    } else {
      dialogVisible.value = false;
    }
  },
});

// 对话框样式
const dialogStyle = computed(() => {
  if (isFullscreen.value) {
    return {
      position: "fixed" as const,
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      right: "auto",
      bottom: "auto",
      transform: "none",
    };
  }

  if (isSnapped.value) {
    // 吸附到右侧，高度与视窗同高
    return {
      position: "fixed" as const,
      right: "0",
      top: "0",
      width: `${dialogWidth.value}px`,
      height: "100vh",
      left: "auto",
      bottom: "auto",
      transform: "none",
    };
  }

  return {
    position: "fixed" as const,
    left: `${dialogX.value}px`,
    top: `${dialogY.value}px`,
    width: `${dialogWidth.value}px`,
    height: `${dialogHeight.value}px`,
  };
});

// 按钮位置（使用 left 和 top，因为 useDraggable 使用这些属性）
const initialX = ref(window.innerWidth - 36 - 35); // right: 35px 转换为 left
const initialY = ref(window.innerHeight - 100 - 30); // bottom: 30px 转换为 top

// 加载保存的位置
const loadButtonPosition = () => {
  try {
    const saved = localStorage.getItem("ai-assistant-button-position");
    if (saved) {
      const position = JSON.parse(saved);
      if (position.right && position.bottom) {
        const right = parseFloat(position.right);
        const bottom = parseFloat(position.bottom);
        if (
          right >= 0 &&
          right <= window.innerWidth &&
          bottom >= 0 &&
          bottom <= window.innerHeight
        ) {
          initialX.value = window.innerWidth - 36 - right;
          initialY.value = window.innerHeight - 100 - bottom;
        }
      }
    }
  } catch (error) {
    console.error("加载按钮位置失败:", error);
  }
};

// 使用 VueUse 的 useDraggable 实现拖拽，限制在视窗内
const { x, y, isDragging } = useDraggable(buttonRef, {
  initialValue: { x: initialX.value, y: initialY.value },
  // 在移动时限制位置，确保按钮不超出视窗
  onMove: (position) => {
    const buttonWidth = 36; // 按钮宽度
    const buttonHeight = 100; // 按钮高度

    // 限制在视窗内
    position.x = Math.max(
      0,
      Math.min(position.x, window.innerWidth - buttonWidth)
    );
    position.y = Math.max(
      0,
      Math.min(position.y, window.innerHeight - buttonHeight)
    );
  },
  onEnd: () => {
    // 拖拽结束时保存位置
    if (isDragging.value) {
      const right = window.innerWidth - x.value - 36;
      const bottom = window.innerHeight - y.value - 100;
      try {
        localStorage.setItem(
          "ai-assistant-button-position",
          JSON.stringify({ right: `${right}px`, bottom: `${bottom}px` })
        );
      } catch (error) {
        console.error("保存按钮位置失败:", error);
      }
    }
  },
});

// 计算按钮样式（将 left/top 转换为 right/bottom）
const buttonPosition = computed(() => {
  return {
    left: `${x.value}px`,
    top: `${y.value}px`,
  };
});

// 按钮点击处理（区分拖拽和点击）
let clickStartTime = 0;
const handleButtonClick = () => {
  // 如果正在拖拽，不触发点击
  if (isDragging.value) {
    return;
  }

  // 检查是否是点击（移动距离很小）
  const now = Date.now();
  if (now - clickStartTime < 200) {
    toggleDialog();
  }
};

// 记录点击开始时间
const handleButtonDown = () => {
  clickStartTime = Date.now();
};


// 切换对话框显示
const toggleDialog = () => {
  // 如果不在登录页，才允许切换
  if (isLoginPage.value) {
    dialogVisible.value = false;
    return;
  }

  dialogVisible.value = !dialogVisible.value;

  if (dialogVisible.value) {
    // 初始化对话框位置（右下角）
    dialogX.value = window.innerWidth - dialogWidth.value - 30;
    dialogY.value = window.innerHeight - dialogHeight.value - 100;
    isFullscreen.value = false;
    isSnapped.value = false;

    // 添加欢迎消息
    if (messages.value.length === 0) {
      messages.value.push({
        role: "assistant",
        content: "您好！我是AI助手，有什么可以帮助您的吗？",
        timestamp: Date.now(),
      });
    }
    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  isFullscreen.value = false;
  isSnapped.value = false;
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  if (isFullscreen.value) {
    isSnapped.value = false;
  }
  nextTick(() => {
    scrollToBottom();
  });
};

// 切换吸附（吸附到右侧，高度与视窗同高）
const toggleSnap = () => {
  if (isSnapped.value) {
    // 取消吸附，恢复之前的位置
    isSnapped.value = false;
    // 恢复之前的位置（如果之前有保存的话）
    dialogX.value = window.innerWidth - dialogWidth.value - 30;
    dialogY.value = window.innerHeight - dialogHeight.value - 100;
  } else {
    // 启用吸附，吸附到右侧
    isFullscreen.value = false;
    isSnapped.value = true;
  }
};

// 处理头部鼠标按下（开始拖拽）
const handleHeaderMouseDown = (e: MouseEvent) => {
  if (isFullscreen.value) return;

  isDraggingDialog = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dialogStartX = dialogX.value;
  dialogStartY = dialogY.value;

  // 如果已吸附，先取消吸附
  if (isSnapped.value) {
    isSnapped.value = false;
    // 恢复拖拽开始时的位置
    dialogX.value = window.innerWidth - dialogWidth.value - 30;
    dialogY.value = window.innerHeight - dialogHeight.value - 100;
    dialogStartX = dialogX.value;
    dialogStartY = dialogY.value;
  }

  document.addEventListener("mousemove", handleDialogMouseMove, { passive: false });
  document.addEventListener("mouseup", handleDialogMouseUp);

  e.preventDefault();
  e.stopPropagation();
};

// 使用 requestAnimationFrame 优化拖拽性能
let rafId: number | null = null;

// 处理拖拽移动
const handleDialogMouseMove = (e: MouseEvent) => {
  if (!isDraggingDialog || isFullscreen.value) return;

  // 取消之前的动画帧
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  // 使用 requestAnimationFrame 确保流畅更新
  rafId = requestAnimationFrame(() => {
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    let newX = dialogStartX + deltaX;
    let newY = dialogStartY + deltaY;

    // 限制在视窗内
    newX = Math.max(0, Math.min(newX, window.innerWidth - dialogWidth.value));
    newY = Math.max(0, Math.min(newY, window.innerHeight - dialogHeight.value));

    // 直接更新 ref，Vue 会立即响应
    dialogX.value = newX;
    dialogY.value = newY;

    // 同时直接更新 DOM 样式，确保即时响应
    if (dialogRef.value) {
      dialogRef.value.style.left = `${newX}px`;
      dialogRef.value.style.top = `${newY}px`;
      dialogRef.value.style.right = "auto";
      dialogRef.value.style.bottom = "auto";
      dialogRef.value.style.transform = "none";
    }

    rafId = null;
  });

  e.preventDefault();
};

// 处理拖拽结束
const handleDialogMouseUp = () => {
  if (isDraggingDialog) {
    isDraggingDialog = false;
    
    // 取消待处理的动画帧
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    document.removeEventListener("mousemove", handleDialogMouseMove);
    document.removeEventListener("mouseup", handleDialogMouseUp);
  }
};

// 发送消息
const sendMessage = async () => {
  const input = userInput.value.trim();
  if (!input || loading.value) return;

  // 添加用户消息
  messages.value.push({
    role: "user",
    content: input,
    timestamp: Date.now(),
  });

  // 清空输入框
  userInput.value = "";

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  // 调用AI API
  loading.value = true;
  try {
    const response = await callBailianAPI(input, messages.value.slice(0, -1));
    messages.value.push({
      role: "assistant",
      content: response,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("AI API调用失败:", error);
    ElMessage.error(error.message || "AI助手暂时无法响应，请稍后再试");
    messages.value.push({
      role: "assistant",
      content: "抱歉，我遇到了一些问题，请稍后再试。",
      timestamp: Date.now(),
    });
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

// 清空消息
const clearMessages = () => {
  messages.value = [
    {
      role: "assistant",
      content: "您好！我是AI助手，有什么可以帮助您的吗？",
      timestamp: Date.now(),
    },
  ];
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop =
      messagesContainerRef.value.scrollHeight;
  }
};

// 格式化消息内容（支持换行）
const formatMessage = (content: string) => {
  return content.replace(/\n/g, "<br>");
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};


// 监听路由变化，如果切换到登录页，关闭对话框
watch(
  () => route.path,
  () => {
    if (isLoginPage.value && dialogVisible.value) {
      dialogVisible.value = false;
      isFullscreen.value = false;
      isSnapped.value = false;
    }
  }
);

// 监听对话框打开
watch(dialogVisible, (newVal) => {
  if (newVal && !isLoginPage.value) {
    // 初始化位置
    dialogX.value = window.innerWidth - dialogWidth.value - 30;
    dialogY.value = window.innerHeight - dialogHeight.value - 100;
    isFullscreen.value = false;
    isSnapped.value = false;
    // 确保对话框元素存在
    nextTick(() => {
      if (dialogRef.value) {
        // 对话框已渲染
      }
    });
  }
});

// 处理窗口大小变化
const handleWindowResize = () => {
  if (dialogVisible.value && !isFullscreen.value) {
    if (isSnapped.value) {
      // 如果已吸附到右侧，保持吸附状态（高度会自动调整为 100vh）
      // 不需要额外处理，因为样式已经设置为 right: 0, height: 100vh
    } else {
      // 确保对话框在视窗内
      dialogX.value = Math.max(
        0,
        Math.min(dialogX.value, window.innerWidth - dialogWidth.value)
      );
      dialogY.value = Math.max(
        0,
        Math.min(dialogY.value, window.innerHeight - dialogHeight.value)
      );
    }
  }
};


// 监听鼠标和触摸事件（仅用于按钮拖拽）
onMounted(() => {
  // 加载按钮位置
  loadButtonPosition();
  // 更新初始位置
  if (buttonRef.value) {
    x.value = initialX.value;
    y.value = initialY.value;
  }
  // 监听窗口大小变化
  window.addEventListener("resize", handleWindowResize);
});

// 在组件卸载时清理
onUnmounted(() => {
  // 清理拖拽事件
  document.removeEventListener("mousemove", handleDialogMouseMove);
  document.removeEventListener("mouseup", handleDialogMouseUp);
  // 清理窗口大小变化监听
  window.removeEventListener("resize", handleWindowResize);
});
</script>

<style>
/* 全局样式：确保对话框不阻止页面交互 */
.ai-dialog-container {
  z-index: 99999;
  pointer-events: auto;
}

.ai-dialog-container * {
  pointer-events: auto;
}

/* 确保 tooltip 显示在对话框之上 */
.el-popper[data-popper-placement] {
  z-index: 100000 !important;
}

/* 确保 tooltip 的箭头也不被遮挡 */
.el-popper__arrow {
  z-index: 100000 !important;
}

/* 确保 tooltip 容器可以显示 */
.el-tooltip__popper {
  z-index: 100000 !important;
}
</style>

<style scoped>
/* 对话框容器样式 - 参考阿里云设计 */
.ai-dialog-container {
  position: fixed;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  will-change: transform;
}

/* 拖拽时禁用 transition，确保即时响应 */
.ai-dialog-container.is-dragging {
  transition: none !important;
}

.ai-dialog-container.is-fullscreen {
  border-radius: 0;
  box-shadow: none;
}

.ai-dialog-container.is-snapped {
  transition: all 0.2s ease-out;
}

/* 对话框头部 */
.ai-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  cursor: move;
  flex-shrink: 0;
}

.ai-dialog-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
  line-height: 24px;
}

.ai-dialog-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-action-btn {
  padding: 4px 8px;
  color: #646a73;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-action-btn:hover {
  color: #3370ff;
  background: #f0f5ff;
}

.header-action-btn.is-active {
  color: #3370ff;
  background: #f0f5ff;
}

.header-icon {
  width: 16px;
  height: 16px;
  display: block;
  object-fit: contain;
  pointer-events: none;
  flex-shrink: 0;
}

/* 对话框内容区域 */
.ai-dialog-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: #fafafa;
}

/* 消息列表 */
.ai-dialog-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 0;
}

.ai-dialog-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.ai-dialog-message.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f0f5ff;
  color: #3370ff;
}

.message-user .message-avatar {
  background: #e6f7ff;
  color: #1890ff;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2329;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-user .message-text {
  background: #3370ff;
  color: #fff;
}

.message-time {
  font-size: 12px;
  color: #8f959e;
  margin-top: 4px;
  padding: 0 4px;
}

.message-loading {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.message-loading span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3370ff;
  animation: loading-dot 1.4s infinite ease-in-out;
}

.message-loading span:nth-child(1) {
  animation-delay: -0.32s;
}

.message-loading span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-dot {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 输入区域 */
.ai-dialog-input-area {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  flex-shrink: 0;
}

.ai-dialog-textarea {
  margin-bottom: 12px;
}

.ai-dialog-textarea :deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
}

.ai-dialog-textarea :deep(.el-textarea__inner):focus {
  border-color: #3370ff;
}

.ai-dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.ai-assistant-button {
  position: fixed !important;
  width: 36px;
  height: 100px;
  background: #fff;
  border-radius: 16px;
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0 0 0;
  cursor: move;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 99 !important;
  color: #333;
  user-select: none;
  touch-action: none;
  visibility: visible !important;
  opacity: 1 !important;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.button-icon-wrapper {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  flex-shrink: 0;
  background-image: url("@/assets/ai-assistant-bg.png");
  background-size: 26px 26px;
  background-position: center;
  background-repeat: no-repeat;
}

.button-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
  display: block;
  pointer-events: none;
}

.button-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.3;
  width: 100%;
  padding: 0 4px;
}

.button-text-line {
  width: 14px;
  margin: 0px auto auto;
  display: block;
  font-size: 14px;
  line-height: 16px;
  font-weight: 500;
}

.ai-assistant-button:hover:not(.is-dragging) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 0 2px rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1);
}

.ai-assistant-button:active:not(.is-dragging) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-assistant-button.is-dragging {
  cursor: grabbing;
  transition: none;
  opacity: 0.95;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.ai-assistant-button.is-open {
  background: #fff;
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2),
    0 0 1px rgba(102, 126, 234, 0.1);
}

.ai-assistant-button.is-open .button-icon-wrapper {
  background-image: url("@/assets/ai-assistant-bg.png");
}

.ai-assistant-button.is-open:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.25),
    0 0 2px rgba(102, 126, 234, 0.15);
}
</style>
