/**
 * 批量翻译处理脚本
 * 用于批量处理翻译数据
 */

const fs = require('fs');
const csv = require('csv-parser');

async function batchTranslate(inputFile, outputFile) {
  const results = [];
  
  fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (data) => {
      // 处理每一行翻译数据
      results.push({
        id: data.id,
        source: data.source,
        'zh-CN': data['zh-CN'],
        'en-US': data['en-US'],
        'zh-HK': data['zh-HK']
      });
    })
    .on('end', () => {
      // 写入处理后的数据
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log('批量处理完成');
    });
}

module.exports = { batchTranslate };
