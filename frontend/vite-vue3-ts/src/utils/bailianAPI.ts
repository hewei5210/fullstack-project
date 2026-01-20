/**
 * 阿里云百炼模型API调用工具
 */

export const BAILIAN_API_KEY = 'sk-8aa11543dd734e09bebb8e98e887fbba';
export const BAILIAN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
export const MODEL_NAME = 'qwen-plus'; // 可以根据需要修改模型，如 qwen-turbo, qwen-plus, qwen-max 等

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface BailianRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface BailianResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
  };
}

/**
 * 调用阿里云百炼模型API
 * @param userInput 用户输入的问题
 * @param historyMessages 历史对话消息（可选）
 * @returns Promise<string> AI回复内容
 */
export async function callBailianAPI(
  userInput: string,
  historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    // 构建消息历史
    const messages: Message[] = [
      {
        role: 'system',
        content: '你是一个有用的AI助手，请用简洁、友好的方式回答用户的问题。'
      },
      ...historyMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userInput
      }
    ];

    // 构建请求体
    const requestBody: BailianRequest = {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    };

    // 发送请求
    const response = await fetch(BAILIAN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `API请求失败: ${response.status} ${response.statusText}`
      );
    }

    const data: BailianResponse = await response.json();

    // 检查是否有错误
    if (data.error) {
      throw new Error(data.error.message || 'API返回错误');
    }

    // 提取AI回复
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content || '抱歉，我没有理解您的问题。';
    }

    throw new Error('API响应格式异常');
  } catch (error: any) {
    console.error('调用阿里云百炼API失败:', error);
    
    // 处理网络错误
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络后重试');
    }
    
    // 处理API错误
    if (error.message) {
      throw error;
    }
    
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
}

/**
 * 获取可用的模型列表（可选，用于未来扩展）
 */
export const AVAILABLE_MODELS = [
  { value: 'qwen-turbo', label: '通义千问-Turbo（快速）' },
  { value: 'qwen-plus', label: '通义千问-Plus（推荐）' },
  { value: 'qwen-max', label: '通义千问-Max（最强）' }
];

