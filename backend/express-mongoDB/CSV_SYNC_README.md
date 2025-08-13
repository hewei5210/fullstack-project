# CSV同步功能使用说明

## 功能概述

CSV同步功能允许您将CSV文件中的数据同步到MongoDB数据库中，支持以下操作：

- 📤 **CSV导入**: 将CSV文件数据导入到MongoDB
- 📥 **数据导出**: 从MongoDB导出数据到CSV文件
- 📊 **统计信息**: 查看同步状态和统计信息
- 🧹 **数据清理**: 清理重复数据
- ✅ **格式验证**: 验证CSV文件格式

## 支持的CSV格式

CSV文件应包含以下列：

```csv
id,Source,target(zh-CN),target(en-US),target(zh-HK)
ccfe-000000001,企业ID,企业ID,Enterprise ID,企業ID
ccfe-000000002,请输入企业ID,请输入企业ID,Please enter the enterprise ID,請輸入企業ID
```

### 列说明

- `id`: 唯一标识符（必填）
- `Source`: 源文本（必填）
- `target(zh-CN)`: 简体中文翻译
- `target(en-US)`: 英文翻译
- `target(zh-HK)`: 繁体中文翻译

## 使用方法

### 1. 命令行工具

#### 同步CSV文件到MongoDB

```bash
# 基本同步
npm run sync-csv sync ../node-csv-server/data/bing.csv

# 更新现有记录
npm run sync-csv sync ../node-csv-server/data/bing.csv --update-existing

# 跳过重复记录
npm run sync-csv sync ../node-csv-server/data/bing.csv --skip-duplicates

# 自定义批处理大小
npm run sync-csv sync ../node-csv-server/data/bing.csv --batch-size 500
```

#### 导出数据到CSV

```bash
# 导出所有数据
npm run export-csv translations_export.csv

# 导出特定状态的数据
npm run export-csv ready_translations.csv --filter '{"status":"ready"}'
```

#### 查看统计信息

```bash
npm run csv-stats
```

#### 清理重复数据

```bash
npm run csv-clean
```

#### 验证CSV文件

```bash
npm run sync-csv validate ../node-csv-server/data/bing.csv
```

### 2. API接口

#### 上传CSV文件并同步

```javascript
// POST /api/csv-sync/upload
const formData = new FormData();
formData.append('csvFile', file);
formData.append('skipDuplicates', 'true');
formData.append('updateExisting', 'true');
formData.append('batchSize', '1000');

fetch('/api/csv-sync/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### 同步指定路径的CSV文件

```javascript
// POST /api/csv-sync/sync-file
fetch('/api/csv-sync/sync-file', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    filePath: '/path/to/your/file.csv',
    options: {
      skipDuplicates: true,
      updateExisting: true,
      batchSize: 1000
    }
  })
});
```

#### 导出数据到CSV

```javascript
// GET /api/csv-sync/export
const filter = JSON.stringify({ status: 'ready' });
window.open(`/api/csv-sync/export?filter=${encodeURIComponent(filter)}&filename=translations.csv`);
```

#### 获取统计信息

```javascript
// GET /api/csv-sync/stats
fetch('/api/csv-sync/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### 清理重复数据

```javascript
// POST /api/csv-sync/clean-duplicates
fetch('/api/csv-sync/clean-duplicates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### 验证CSV文件

```javascript
// POST /api/csv-sync/validate
const formData = new FormData();
formData.append('csvFile', file);

fetch('/api/csv-sync/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## 配置选项

### 同步选项

- `skipDuplicates`: 是否跳过重复记录（默认: true）
- `updateExisting`: 是否更新现有记录（默认: true）
- `batchSize`: 批处理大小（默认: 1000）

### 文件限制

- 最大文件大小: 10MB
- 支持格式: CSV文件
- 编码: UTF-8

## 错误处理

### 常见错误

1. **文件不存在**
   ```
   Error: CSV文件不存在: /path/to/file.csv
   ```

2. **文件格式错误**
   ```
   Error: 只允许上传CSV文件
   ```

3. **文件过大**
   ```
   Error: 文件大小超过限制
   ```

4. **数据库连接失败**
   ```
   Error: 数据库连接失败
   ```

### 调试建议

1. 检查CSV文件格式是否正确
2. 确认数据库连接正常
3. 查看服务器日志获取详细错误信息
4. 使用验证功能检查CSV文件

## 性能优化

### 大数据量处理

- 使用批处理减少数据库操作
- 调整批处理大小根据服务器性能
- 监控内存使用情况

### 建议的批处理大小

- 小文件 (< 1MB): 100-500
- 中等文件 (1-10MB): 500-1000
- 大文件 (> 10MB): 1000-2000

## 监控和日志

### 进度监控

同步过程中会显示实时进度：

```
📊 进度: 45.2% (452/1000)
```

### 统计信息

同步完成后会显示详细统计：

```
📈 统计信息:
   - 总记录数: 1000
   - 新增: 800
   - 更新: 150
   - 跳过: 50
   - 错误: 0
```

## 安全注意事项

1. **文件上传安全**
   - 验证文件类型
   - 限制文件大小
   - 扫描恶意内容

2. **数据安全**
   - 使用身份验证
   - 记录操作日志
   - 定期备份数据

3. **权限控制**
   - 限制访问权限
   - 审计操作记录
   - 监控异常行为

## 故障排除

### 问题1: 同步速度慢

**解决方案:**
- 增加批处理大小
- 检查数据库索引
- 优化网络连接

### 问题2: 内存不足

**解决方案:**
- 减少批处理大小
- 增加服务器内存
- 使用流式处理

### 问题3: 数据不一致

**解决方案:**
- 检查CSV文件格式
- 验证数据完整性
- 使用清理功能

## 联系支持

如果遇到问题，请：

1. 查看错误日志
2. 检查配置设置
3. 联系技术支持

---

**版本**: 1.0.0  
**更新日期**: 2024-01-XX  
**维护者**: 开发团队
