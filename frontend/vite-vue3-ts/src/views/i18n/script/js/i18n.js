/**
 * 支持多参数替换的国际化方法
 * @param {string} translatedText - 国际化键值，必须是$t函数调用格式：$t('ccfe-xxxxxxxxx')
 * @param {string} target1 - 要被替换的内容或待匹配的字符（第二个参数）
 * @param {string} replaceValue1 - 替换第二个参数的内容（第三个参数）
 * @param {string} mode1 - 替换模式：'matching'或'replace'（第四个参数）
 * @param {string} target2 - 要被替换的内容或待匹配的字符（第五个参数，可选）
 * @param {string} replaceValue2 - 替换第五个参数的内容（第六个参数，可选）
 * @param {string} mode2 - 替换模式：'matching'或'replace'（第七个参数，可选）
 * @param {Object} i18nInstance - i18n实例（可选）
 * @returns {string} 处理后的文本
 */
export function i18nWithVariables(translatedText, target1, replaceValue1, mode1, target2, replaceValue2, mode2) {
  // 处理参数替换
  let result = translatedText

  // 处理第一组参数
  if (target1 && replaceValue1 !== undefined && mode1) {
    result = processReplacement(result, target1, replaceValue1, mode1)
  }

  // 处理第二组参数
  if (target2 && replaceValue2 !== undefined && mode2) {
    result = processReplacement(result, target2, replaceValue2, mode2)
  }

  return result
}

/**
 * 处理替换逻辑
 * @param {string} text - 要处理的文本
 * @param {string} target - 目标内容
 * @param {string} replaceValue - 替换值
 * @param {string} mode - 替换模式：'matching'或'replace'
 * @returns {string} 处理后的文本
 */
function processReplacement(text, target, replaceValue, mode) {
  if (mode === 'matching') {
    // matching模式：匹配target和对应结束符之间的内容，只保留替换值
    const endChar = getMatchingEndChar(target)
    if (endChar) {
      let pattern
      if (target === '{' && endChar === '}') {
        // 特殊处理Vue的{{...}}插值语法
        // 匹配整个 {{ 任意内容 }} 结构
        pattern = `\\{\\{([^\\}]*?)\\}\\}`
      } else {
        // 对于其他匹配字符，使用通用模式
        pattern = `${escapeRegExp(target)}([^${escapeRegExp(endChar)}]*?)${escapeRegExp(endChar)}`
      }
      return text.replace(new RegExp(pattern, 'g'), replaceValue)
    }
  } else if (mode === 'replace') {
    // replace模式：直接替换target
    return text.replace(new RegExp(escapeRegExp(target), 'g'), replaceValue)
  }

  return text
}

/**
 * 获取匹配的结束字符
 * @param {string} startChar - 开始字符
 * @returns {string} 对应的结束字符
 */
function getMatchingEndChar(startChar) {
  const matchingPairs = {
    '$': '}',
    '{': '}',
    '[': ']',
    '(': ')',
    '<': '>',
    '"': '"',
    "'": "'",
    '`': '`'
  }
  return matchingPairs[startChar] || null
}

/**
 * 转义正则表达式中的特殊字符
 * @param {string} str 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^=!:${}()|[\]/\\]/g, '\\$&')
}


export function replaceVariables(text, variables = {}) {
  if (!text || typeof text !== 'string') {
    return text
  }

  // 匹配 {{ variable.path }} 格式的占位符
  const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g

  return text.replace(variableRegex, (match, variablePath) => {
    // 去除空格
    const cleanPath = variablePath.trim()

    // 获取变量值
    const value = getNestedValue(variables, cleanPath)

    // 如果找不到对应的值，返回原始占位符
    if (value === undefined || value === null) {
      console.warn(`未找到变量值: ${cleanPath}`)
      return match
    }

    return String(value)
  })
}

export function getNestedValue(obj, path) {
  if (!obj || !path) {
    return undefined
  }

  // 分割路径
  const keys = path.split('.')
  let current = obj

  // 逐层访问属性
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = current[key]
  }

  return current
}

/**
 * Vue组件中使用的mixin，提供i18nWithVariables方法
 */
export const i18nMixin = {
  methods: {
    $i18nWithVariables(key, target1, replaceValue1, mode1, target2, replaceValue2, mode2) {
      return i18nWithVariables(key, target1, replaceValue1, mode1, target2, replaceValue2, mode2, this.$i18n)
    }
  }
}


export function batchI18nWithVariables(keys, variables = {}, i18nInstance = null) {
  const result = {}

  keys.forEach(key => {
    result[key] = i18nWithVariables(key, variables, i18nInstance)
  })

  return result
}

export default {
  i18nWithVariables,
  replaceVariables,
  getNestedValue,
  i18nMixin,
  batchI18nWithVariables
}
