/**
 * Excel去重脚本
 * 功能：比较两个Excel文件（A和B），删除B文件中第一列与A文件第一列重复的行
 * 
 * 使用说明：
 * 1. 需要安装xlsx库：npm install xlsx
 * 2. 准备两个Excel文件：A.xlsx（参考文件）和B.xlsx（待处理文件）
 * 3. 运行脚本后生成B_filtered.xlsx（去重后的文件）
 * 
 * 处理逻辑：
 * - 读取A文件和B文件的第一个工作表
 * - 提取A文件第一列的值作为去重依据
 * - 过滤B文件，保留第一列不在A文件中的行
 * - 保留表头，输出到新文件
 */

const XLSX = require('xlsx');

// 主处理函数
function processFiles() {
    // 读取文件
    const workbookA = XLSX.readFile('A.xlsx');
    const workbookB = XLSX.readFile('B.xlsx');
    
    // 获取工作表数据
    const sheetA = workbookA.Sheets[workbookA.SheetNames[0]];
    const sheetB = workbookB.Sheets[workbookB.SheetNames[0]];
    
    // 转换数据并跳过表头
    const dataA = XLSX.utils.sheet_to_json(sheetA, { header: 1 }).slice(1);
    const dataB = XLSX.utils.sheet_to_json(sheetB, { header: 1 }).slice(1);
    
    // 创建A文件第一列值的集合
    const columnAValues = new Set(dataA.map(row => row[0]?.toString().trim() || ''));
    
    // 过滤B文件数据
    const filteredDataB = dataB.filter(row => {
        const value = row[0]?.toString().trim() || '';
        return !columnAValues.has(value);
    });
    
    // 重新构建带表头的完整数据
    const headerB = XLSX.utils.sheet_to_json(sheetB, { header: 1 })[0];
    const newSheetB = XLSX.utils.aoa_to_sheet([headerB, ...filteredDataB]);
    
    // 保存结果
    workbookB.Sheets[workbookB.SheetNames[0]] = newSheetB;
    XLSX.writeFile(workbookB, 'B_filtered.xlsx');
    
    console.log('处理完成，结果已保存到 B_filtered.xlsx');
}

// 执行处理
processFiles();