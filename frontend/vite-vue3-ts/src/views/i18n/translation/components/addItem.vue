<template>
  <el-dialog
    v-model="visible"
    title="新增翻译项"
    width="35%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      :model="formData"
      :rules="rules"
      ref="formRef"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="翻译项" prop="source">
        <div class="source-input-container">
          <el-input
            v-model="formData.source"
            placeholder="请输入翻译项"
            class="translation-input"
            clearable
            @focus="clearSourceValidation"
          />
          <el-tooltip
            content="请输入翻译项"
            :disabled="!!formData.source.trim()"
            placement="top"
          >
            <el-button
              type="text"
              :loading="translating"
              :disabled="!formData.source.trim()"
              @click="handleAITranslate"
              class="ai-translate-btn"
            >
              AI翻译
            </el-button>
          </el-tooltip>
        </div>
      </el-form-item>
      <!-- <el-form-item label="翻译项-中文" prop="target['zh-CN']">
        <el-input
          v-model="formData.target['zh-CN']"
          placeholder="请输入翻译项-中文"
          class="translation-input"
          clearable
        />
      </el-form-item> -->
      <el-form-item label="翻译项-英文" prop="target['en-US']">
        <el-input
          v-model="formData.target['en-US']"
          placeholder="请输入翻译项-英文"
          class="translation-input"
          clearable
        />
      </el-form-item>
      <el-form-item label="翻译项-繁体" prop="target['zh-HK']">
        <el-input
          v-model="formData.target['zh-HK']"
          placeholder="请输入翻译项-繁体"
          class="translation-input"
          clearable
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { http } from "../../../../net/http";
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus"; // Import ElMessage as a value
import type { FormInstance, FormRules } from "element-plus";
import { handleError } from "../../../../utils/errorHandler";
import { callBailianAPI } from "../../../../utils/bailianAPI";

interface TranslationItem {
  id: string;
  source: string;
  target: {
    "zh-CN": string;
    "en-US": string;
    "zh-HK": string;
  };
}

const props = defineProps<{
  modelValue: boolean;
  initialData?: TranslationItem;
}>();

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref<FormInstance>();
const visible = ref(props.modelValue);
const translating = ref(false);
// 初始化表单数据
const formData = reactive<TranslationItem>({
  id: props.initialData?.id || "",
  source: props.initialData?.source || "",
  target: {
    "zh-CN": props.initialData?.target["zh-CN"] || "",
    "en-US": props.initialData?.target["en-US"] || "",
    "zh-HK": props.initialData?.target["zh-HK"] || "",
  },
});

const rules = reactive<FormRules>({
  source: [{ required: true, message: "翻译项不能为空", trigger: "blur" }],
});

// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => (visible.value = val)
);
watch(visible, (val) => emit("update:modelValue", val));

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    formData.target["zh-CN"] = formData.source;
    
    await http.post("/api/addBing", {
      source: formData.source,
      target: formData.target,
    });
    
    ElMessage.success("添加成功");
    emit("submit", formData);
    visible.value = false;
  } catch (error: any) {
    // 表单验证错误
    if (error.message && error.message.includes('验证')) {
      console.log("表单验证失败:", error);
      return;
    }
    
    // 使用统一的错误处理
    handleError(error, "添加失败");
  }
};

const handleClose = () => {
  formRef.value?.resetFields();
};

// 清除翻译项验证错误
const clearSourceValidation = () => {
  formRef.value?.clearValidate('source');
};

// AI翻译功能
const handleAITranslate = async () => {
  if (!formData.source.trim()) {
    ElMessage.warning("翻译项不能为空");
    return;
  }

  translating.value = true;
  try {
    // 构建翻译提示词
    const prompt = `请将以下中文文本翻译成英文和繁体中文。请严格按照以下JSON格式返回结果，不要添加任何其他内容：
{
  "en-US": "英文翻译",
  "zh-HK": "繁体中文翻译"
}

需要翻译的文本：${formData.source}`;

    // 调用AI接口
    const response = await callBailianAPI(prompt);

    // 尝试解析JSON格式的响应
    let translationResult: { "en-US"?: string; "zh-HK"?: string } = {};
    
    try {
      // 尝试直接解析JSON
      translationResult = JSON.parse(response);
    } catch (e) {
      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        translationResult = JSON.parse(jsonMatch[0]);
      } else {
        // 如果无法解析JSON，尝试从文本中提取
        // 查找包含"en-US"和"zh-HK"的部分
        const enMatch = response.match(/["']en-US["']\s*:\s*["']([^"']+)["']/i) || 
                       response.match(/en-US[：:]\s*([^\n]+)/i);
        const zhHKMatch = response.match(/["']zh-HK["']\s*:\s*["']([^"']+)["']/i) || 
                         response.match(/zh-HK[：:]\s*([^\n]+)/i);
        
        if (enMatch) {
          translationResult["en-US"] = enMatch[1].trim();
        }
        if (zhHKMatch) {
          translationResult["zh-HK"] = zhHKMatch[1].trim();
        }
      }
    }

    // 填充翻译结果
    if (translationResult["en-US"]) {
      formData.target["en-US"] = translationResult["en-US"];
    }
    if (translationResult["zh-HK"]) {
      formData.target["zh-HK"] = translationResult["zh-HK"];
    }

    // 如果成功获取到至少一个翻译结果
    if (translationResult["en-US"] || translationResult["zh-HK"]) {
      ElMessage.success("AI翻译完成");
    } else {
      ElMessage.warning("未能解析翻译结果，请手动填写");
    }
  } catch (error: any) {
    console.error("AI翻译失败:", error);
    ElMessage.error(error.message || "AI翻译失败，请稍后重试");
  } finally {
    translating.value = false;
  }
};
</script>
<style scoped>
.inline-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.source-input-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
}

.source-input-container .translation-input {
  flex: 1;
  max-width: calc(100% - 60px); /* 减去按钮宽度和gap，确保与其他输入框宽度一致 */
}

.translation-input {
  width: 100%;
  max-width: calc(100% - 60px); /* 与"翻译项"输入框宽度一致 */
}

.ai-translate-btn {
  flex-shrink: 0;
  width: 50px; /* 固定按钮宽度，便于计算 */
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: inherit;
  min-height: auto;
  height: auto;
  text-align: left;
}

.ai-translate-btn:hover:not(:disabled) {
  background: transparent;
  color: var(--el-color-primary);
}

.ai-translate-btn:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
</style>
