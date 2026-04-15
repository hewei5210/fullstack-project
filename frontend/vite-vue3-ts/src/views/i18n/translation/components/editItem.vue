<template>
  <el-dialog
    :model-value="modelValue"
    @close="handleCancel"
    title="编辑翻译项"
    width="35%"
    :close-on-click-modal="false"
  >
    <el-form
      :model="localEditItem"
      ref="formRef"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="翻译项ID" prop="id">
        <el-input
          v-model="localEditItem.id"
          placeholder="请生成翻译项ID"
          clearable
          disabled
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
      <el-form-item label="翻译项" prop="source">
        <div class="source-input-wrapper">
          <el-input
            v-model="localEditItem.target['zh-CN']"
            placeholder="请输入翻译项"
            clearable
            class="source-input-same-width"
            @focus="clearSourceValidation"
          />
          <el-tooltip
            content="请输入翻译项"
            :disabled="!!(localEditItem.target['zh-CN'] || '').trim()"
            placement="top"
          >
            <el-button
              type="text"
              :loading="translating"
              :disabled="!(localEditItem.target['zh-CN'] || '').trim()"
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
          v-model="localEditItem.target['zh-CN']"
          placeholder="请输入翻译项-中文"
          style="flex: 1; margin-right: 70px"
          clearable
        />
      </el-form-item> -->
      <el-form-item label="翻译项-英文" prop="target['en-US']">
        <el-input
          v-model="localEditItem.target['en-US']"
          placeholder="请输入翻译项-英文"
          clearable
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
      <el-form-item label="翻译项-繁体" prop="target['zh-HK']">
        <el-input
          v-model="localEditItem.target['zh-HK']"
          placeholder="请输入翻译项-繁体"
          clearable
          style="flex: 1; margin-right: 70px"
        />
      </el-form-item>
      <el-form-item label="所属项目">
        <el-select
          v-model="localEditItem.projectCode"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="不选则属于所有项目"
          class="edit-item-project-select"
          popper-class="edit-item-project-select-dropdown"
          clearable
          style="flex: 1; margin-right: 70px"
        >
          <el-option
            v-for="item in PROJECT_TAGS"
            :key="item.projectCode"
            :label="item.label"
            :value="item.projectCode"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { http } from "../../../../net/http";
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { handleError } from "../../../../utils/errorHandler";
import { callBailianAPI } from "../../../../utils/bailianAPI";

interface ProjectTag {
  label: string;
  projectCode: string;
}

interface Translation {
  id: string;
  target: Record<string, string>;
  projectCode?: string[];
  status: string;
}

// 基于类型的 Props 声明
const props = defineProps<{
  modelValue: boolean;
  currentEditItem: Translation;
}>();

const emit = defineEmits<{
  (e: "update:model-value", value: boolean): void;
  (e: "submit", value: Translation): void;
}>();

// 所属项目选项（静态数据，与新增翻译项、后端保持一致）
const PROJECT_TAGS: ProjectTag[] = [
  { label: "云管", projectCode: "cda_cem_client" },
  { label: "工作台", projectCode: "cem-quality-protal" },
  { label: "二级管", projectCode: "cutt_rpmp_porta" },
  { label: "订购页", projectCode: "cloud_computer_client" },
  { label: "控制台", projectCode: "computer_entconsole_client" },
  { label: "企业门户", projectCode: "ccemp-web" },
];

const localEditItem = ref<Translation>(
  JSON.parse(JSON.stringify(props.currentEditItem))
);
const formRef = ref();
const translating = ref(false);

// 初始化后数据隔离
// 仅在组件初始化时复制一次父级数据，后续父级数据变化不会自动更新
watch(
  () => props.currentEditItem,
  (newVal) => {
    const copy = JSON.parse(JSON.stringify(newVal));
    if (!Array.isArray(copy.projectCode)) copy.projectCode = [];
    localEditItem.value = copy;
  },
  { deep: true }
);

// 同步 v-model 状态
watch(
  () => props.modelValue,
  (val) => {
    console.log("props.modelValue", val);
  }
);

const handleCancel = () => {
  emit("update:model-value", false);
};

// 清除翻译项验证错误
const clearSourceValidation = () => {
  formRef.value?.clearValidate?.("source");
};

// AI翻译功能
const handleAITranslate = async () => {
  const source = (localEditItem.value.target["zh-CN"] || "").trim();
  if (!source) {
    ElMessage.warning("翻译项不能为空");
    return;
  }

  translating.value = true;
  try {
    const prompt = `请将以下中文文本翻译成英文和繁体中文。请严格按照以下JSON格式返回结果，不要添加任何其他内容：
{
  "en-US": "英文翻译",
  "zh-HK": "繁体中文翻译"
}

需要翻译的文本：${source}`;

    const response = await callBailianAPI(prompt);

    let translationResult: { "en-US"?: string; "zh-HK"?: string } = {};

    try {
      translationResult = JSON.parse(response);
    } catch (e) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        translationResult = JSON.parse(jsonMatch[0]);
      } else {
        const enMatch =
          response.match(/["']en-US["']\s*:\s*["']([^"']+)["']/i) ||
          response.match(/en-US[：:]\s*([^\n]+)/i);
        const zhHKMatch =
          response.match(/["']zh-HK["']\s*:\s*["']([^"']+)["']/i) ||
          response.match(/zh-HK[：:]\s*([^\n]+)/i);

        if (enMatch) {
          translationResult["en-US"] = enMatch[1].trim();
        }
        if (zhHKMatch) {
          translationResult["zh-HK"] = zhHKMatch[1].trim();
        }
      }
    }

    if (translationResult["en-US"]) {
      localEditItem.value.target["en-US"] = translationResult["en-US"];
    }
    if (translationResult["zh-HK"]) {
      localEditItem.value.target["zh-HK"] = translationResult["zh-HK"];
    }

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

const handleSubmit = async () => {
  try {
    await http.put("/api/updateBing", {
      id: localEditItem.value.id,
      source: localEditItem.value.target["zh-CN"],
      target: localEditItem.value.target,
      projectCode: Array.isArray(localEditItem.value.projectCode) ? localEditItem.value.projectCode : [],
    });
    
    ElMessage.success("编辑成功");
    emit("update:model-value", false);
    emit("submit", localEditItem.value);
  } catch (error: any) {
    handleError(error, "编辑失败");
  }
};
</script>

<style scoped>
.source-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.source-input-wrapper .source-input-same-width {
  flex: 1;
  margin-right: 70px;
}

.source-input-wrapper .ai-translate-btn {
  position: absolute;
  right: 0;
  padding: 0 4px;
  margin: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: inherit;
  height: auto;
}

.source-input-wrapper .ai-translate-btn:hover:not(:disabled) {
  background: transparent;
  color: var(--el-color-primary);
}

.source-input-wrapper .ai-translate-btn:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
</style>
<!-- 下拉挂在 body：勿设大于触发器的 min-width，否则会宽过选择框 -->
<style>
.edit-item-project-select-dropdown.el-select-dropdown {
  box-sizing: border-box;
}
</style>
