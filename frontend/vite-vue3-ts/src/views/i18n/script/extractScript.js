/**
 * 使用说明:
 * 该脚本用于遍历指定目录或文件，提取 Vue 文件以及其他类型文件（支持 .vue、.js、.css、.html、.json）中的中文文本，并将提取结果输出到 Excel 文件中。
 * 可以选择将每个文件的提取内容分列输出（每个文件一列），或者合并到一列中（所有文件内容合并成一列）。
 *
 * 使用方法:
 * 1. 在终端中运行以下命令：
 *    node script.js <inputPath> <outputFile> <mode>
 * 
 * 参数说明:
 * - <inputPath>（必填）: 需要处理的文件或文件夹路径。
 * - <outputFile>（可选）: 生成的 Excel 文件名称（可选，默认为 `output.xlsx`）。
 * - <mode>（可选）: 输出模式，支持以下两种：
 *   - `multi`（默认值）: 多列输出模式，每个文件的提取内容分别输出到不同列。
 *   - `single`: 单列输出模式，所有文件的提取内容合并输出到一列。
 *
 * 示例:
 * 1. 多列输出（每个文件一列）:
 *    node extractChinese.js ./src output.xlsx multi
 * 
 * 2. 单列输出（所有文件内容合并为一列）:
 *    node extractChinese.js ./src output_single.xlsx single
 * 
 * 功能概述:
 * - 支持多种文件类型（.vue、.js、.css、.html、.json），可递归遍历指定目录。
 * - 匹配中文字符，并去除代码中的注释内容。
 * - 支持去重功能，确保输出的文本没有重复。
 * - 自动设置 Excel 列宽，确保中文内容显示清晰。
 * 
 * 注意事项:
 * - 输出模式可以通过第三个参数来控制，`multi` 模式下每个文件对应一列，`single` 模式下所有文件的内容合并为一列。
 */

const fs = require('fs-extra');
const path = require('path');
const xlsx = require('xlsx');

// 匹配中文的正则表达式，过滤掉注释的中文
const chineseRegex = /[\u4e00-\u9fa5]+/g;
const commentRegex = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/.*/g; // 处理 HTML 注释、JS 多行/单行注释

// 遍历文件夹
function traverseDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            traverseDir(filePath, fileList);
        } else if (['.vue', '.js', '.css', '.html', '.json'].some(ext => file.endsWith(ext))) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

// 从文件中提取汉字，并处理前后查找，确保汉字不被分割
function extractChineseFromFile(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const withoutComments = content.replace(commentRegex, ''); // 去除注释
    const chineseMatches = [...withoutComments.matchAll(chineseRegex)]; // 提取所有匹配的中文

    let result = [];

    chineseMatches.forEach(match => {
        let startIndex = match.index;
        let endIndex = match.index + match[0].length;

        // 向前查找，直到找到单引号、双引号、模板字符串或 >，对于 .js 文件，也要查找大括号和逗号
        while (startIndex > 0) {
            const char = withoutComments[startIndex - 1];
            if (char === "'" || char === '"' || char === '`' || char === '>' || (file.endsWith('.js') && (char === '{' || char === ','))) {
                break;
            }
            startIndex--;
        }

        // 向后查找，直到找到单引号、双引号、模板字符串或 <，对于 .js 文件，找到冒号时停止
        while (endIndex < withoutComments.length) {
            const char = withoutComments[endIndex];
            if (char === "'" || char === '"' || char === '`' || char === '<' || (file.endsWith('.js') && char === ':')) {
                break;
            }
            endIndex++;
        }

        // 截取前后匹配到的字符串，并去掉前后的换行符
        const fullMatch = withoutComments.slice(startIndex, endIndex).trim();
        result.push(fullMatch.replace(/\n/g, ''));
    });

    return result;
}

// 去重
function removeDuplicates(array) {
    return [...new Set(array)];
}

// 写入到 Excel
function writeToExcel(fileData, outputFile, isSingleColumn = false) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.aoa_to_sheet([]);  // 空表格

    if (isSingleColumn) {
        // 单列输出
        const combinedData = fileData.reduce((acc, data) => acc.concat(data.texts), []);
        const uniqueData = removeDuplicates(combinedData);  // 去重
        uniqueData.forEach((text, index) => {
            xlsx.utils.sheet_add_aoa(ws, [[text]], {origin: `A${index + 1}`});  // 写入A列
        });

        // 设置列宽度
        ws['!cols'] = [{ wch: 20 }];
    } else {
        // 多列输出，每个文件对应一列
        const headers = fileData.map(data => data.fileName);
        xlsx.utils.sheet_add_aoa(ws, [headers], {origin: "A1"});  // 第一行写入文件名

        // 找出最大行数
        const maxRowCount = Math.max(...fileData.map(data => data.texts.length));

        // 将每个文件的提取内容按列写入，补齐空行
        fileData.forEach((data, colIndex) => {
            for (let rowIndex = 0; rowIndex < maxRowCount; rowIndex++) {
                const text = data.texts[rowIndex] || '';  // 如果没有内容则补空字符串
                xlsx.utils.sheet_add_aoa(ws, [[text]], {origin: {r: rowIndex + 1, c: colIndex}});  // 从第一行开始写入
            }
        });

        // 设置列宽度
        const colWidths = fileData.map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;
    }

    xlsx.utils.book_append_sheet(wb, ws, 'Chinese Text');
    xlsx.writeFile(wb, outputFile);
}

// 主函数
function main() {
    // node script.js <inputPath> <outputFile> <mode>
    const inputPath = process.argv[2]; // 从命令行获取输入路径
    const outputFile = process.argv[3] || 'output.xlsx';  // 输出的 Excel 文件名
    const mode = process.argv[4] || 'multi';  // 输出模式：'single' 为单列，'multi' 为多列

    if (!inputPath) {
        console.error('Please provide a file or directory path.');
        process.exit(1);
    }

    let files = [];

    const stat = fs.statSync(inputPath);
    if (stat.isDirectory()) {
        files = traverseDir(inputPath); // 如果是目录，获取所有目标文件
    } else if (stat.isFile() && ['.vue', '.js', '.css', '.html', '.json'].some(ext => inputPath.endsWith(ext))) {
        files.push(inputPath); // 如果是单个文件
    } else {
        console.error('Invalid input. Please provide a file or directory path.');
        process.exit(1);
    }

    let fileData = [];

    files.forEach(file => {
        const extractedTexts = extractChineseFromFile(file);
        fileData.push({
            fileName: path.basename(file),  // 获取文件名
            texts: removeDuplicates(extractedTexts)    // 去重后的文本
        });
    });

    const isSingleColumn = mode === 'single';
    writeToExcel(fileData, outputFile, isSingleColumn);  // 写入 Excel
    console.log(`Excel file (${mode} column) has been created successfully!`);
}

main();
