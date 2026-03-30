"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Translation_1 = __importDefault(require("../models/Translation"));
const exceljs_1 = __importDefault(require("exceljs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const PROJECT_TAGS = [
    { label: '订购页', projectCode: 'cloud_computer_client' },
    { label: '控制台', projectCode: 'computer_entconsole_client' },
    { label: '企业门户', projectCode: 'ccemp-web' },
    { label: '云管', projectCode: 'cda_cem_client' },
    { label: '工作台', projectCode: 'cem-quality-protal' },
    { label: '二级管', projectCode: 'cutt_rpmp_porta' },
];
class TranslationService {
    async getProjectTags() {
        return PROJECT_TAGS;
    }
    buildProjectFilter(projectCodes) {
        if (!projectCodes || projectCodes.length === 0)
            return {};
        return {
            $or: [
                { projectCode: { $in: projectCodes } },
                { projectCode: { $exists: false } },
                { projectCode: [] },
                { projectCode: { $size: 0 } }
            ]
        };
    }
    normalizeProjectCodes(projectCodes) {
        if (projectCodes == null || projectCodes === '')
            return undefined;
        if (Array.isArray(projectCodes))
            return projectCodes.length ? projectCodes : undefined;
        const s = String(projectCodes).trim();
        if (!s)
            return undefined;
        return s.split(',').map((c) => c.trim()).filter(Boolean);
    }
    async getList(query = {}) {
        const { page = 1, pageSize = 10, sort = 'id', projectCodes } = query;
        const skip = (page - 1) * pageSize;
        const filter = this.buildProjectFilter(this.normalizeProjectCodes(projectCodes));
        const translations = await Translation_1.default.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(pageSize.toString()));
        const total = await Translation_1.default.countDocuments(filter);
        return {
            data: translations,
            total,
            page: parseInt(page.toString()),
            pageSize: parseInt(pageSize.toString()),
            totalPages: Math.ceil(total / parseInt(pageSize.toString()))
        };
    }
    async search(searchParams) {
        const { searchContent, searchSelect = 'id', page = 1, pageSize = 10 } = searchParams;
        let exactMatch = false;
        if (searchParams.exactMatch !== undefined) {
            if (typeof searchParams.exactMatch === 'string') {
                exactMatch = searchParams.exactMatch === 'true';
            }
            else if (typeof searchParams.exactMatch === 'boolean') {
                exactMatch = searchParams.exactMatch;
            }
        }
        const projectFilter = this.buildProjectFilter(this.normalizeProjectCodes(searchParams.projectCodes));
        let contentQuery = {};
        if (searchContent) {
            if (exactMatch) {
                if (searchSelect === 'id') {
                    contentQuery.id = searchContent;
                }
                else if (searchSelect === 'zh-CN') {
                    contentQuery.source = searchContent;
                }
                else if (searchSelect === 'en-US') {
                    contentQuery['target.en-US'] = searchContent;
                }
                else if (searchSelect === 'zh-HK') {
                    contentQuery['target.zh-HK'] = searchContent;
                }
            }
            else {
                if (searchSelect === 'id') {
                    contentQuery.id = { $regex: searchContent, $options: 'i' };
                }
                else if (searchSelect === 'zh-CN') {
                    contentQuery.source = { $regex: searchContent, $options: 'i' };
                }
                else if (searchSelect === 'en-US') {
                    contentQuery['target.en-US'] = { $regex: searchContent, $options: 'i' };
                }
                else if (searchSelect === 'zh-HK') {
                    contentQuery['target.zh-HK'] = { $regex: searchContent, $options: 'i' };
                }
            }
        }
        const query = Object.keys(projectFilter).length > 0
            ? (Object.keys(contentQuery).length > 0 ? { $and: [projectFilter, contentQuery] } : projectFilter)
            : (Object.keys(contentQuery).length > 0 ? contentQuery : {});
        const skip = (page - 1) * pageSize;
        const translations = await Translation_1.default.find(query)
            .sort('id')
            .skip(skip)
            .limit(parseInt(pageSize.toString()));
        const total = await Translation_1.default.countDocuments(query);
        return {
            data: translations,
            total,
            page: parseInt(page.toString()),
            pageSize: parseInt(pageSize.toString()),
            totalPages: Math.ceil(total / parseInt(pageSize.toString()))
        };
    }
    async add(translationData) {
        const { target, projectCode } = translationData;
        const existingTranslation = await Translation_1.default.findOne({ source: target['zh-CN'] });
        if (existingTranslation) {
            throw new Error('翻译项已存在，无法重复添加');
        }
        const id = await this.generateNewId();
        const translation = new Translation_1.default({
            id,
            source: target['zh-CN'],
            target,
            projectCode: Array.isArray(projectCode) ? projectCode : []
        });
        return await translation.save();
    }
    async update(translationData) {
        const { id, source, target, projectCode } = translationData;
        const updateFields = { source, target };
        if (projectCode !== undefined) {
            updateFields.projectCode = Array.isArray(projectCode) ? projectCode : [];
        }
        const translation = await Translation_1.default.findOneAndUpdate({ id }, updateFields, { new: true, runValidators: true });
        if (!translation) {
            throw new Error('翻译项不存在');
        }
        return translation;
    }
    async delete(id) {
        const translation = await Translation_1.default.findOneAndDelete({ id });
        if (!translation) {
            throw new Error('翻译项不存在');
        }
        return translation;
    }
    async generateNewId() {
        const translations = await Translation_1.default.find().sort({ id: 1 });
        if (translations.length === 0) {
            return 'ccfe-000000001';
        }
        const existingNumbers = translations.map(item => {
            const match = item.id.match(/ccfe-(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }).filter(num => num > 0).sort((a, b) => a - b);
        let expectedNumber = 1;
        for (const num of existingNumbers) {
            if (num > expectedNumber) {
                break;
            }
            expectedNumber = num + 1;
        }
        return `ccfe-${expectedNumber.toString().padStart(9, '0')}`;
    }
    async exportJsonData(langType = 'zh-CN', projectCodes) {
        const filter = this.buildProjectFilter(this.normalizeProjectCodes(projectCodes));
        const translations = await Translation_1.default.find(filter).sort('id');
        let jsonData = {};
        if (langType === "zh-CN" || langType === "zh-HK" || langType === "en-US") {
            translations.forEach((item) => {
                jsonData[item.id] = item.target[langType];
            });
        }
        const fileName = `${langType}.json`;
        const filePath = path_1.default.join(process.cwd(), "exports", fileName);
        const jsonContent = JSON.stringify(jsonData, null, 2);
        if (!fs_1.default.existsSync(path_1.default.dirname(filePath))) {
            fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
        }
        fs_1.default.writeFileSync(filePath, jsonContent);
        console.log('文件写入成功:', filePath);
        return {
            filePath,
            fileName,
            done: () => {
                try {
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                        console.log('临时文件清理成功:', filePath);
                    }
                }
                catch (error) {
                    console.error('清理临时文件失败:', error);
                }
            },
        };
    }
    downloadTemplate() {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('翻译模板');
        worksheet.columns = [
            { header: "翻译项", key: "zh-CN", width: 30 },
            { header: "翻译项-英文", key: "en-US", width: 30 },
            { header: "翻译项-繁体", key: "zh-HK", width: 30 },
            { header: "所属项目", key: "projectCode", width: 40 },
        ];
        return workbook;
    }
    async exportExcelData(includeId = false, includeProject = false, projectCodes) {
        const filter = this.buildProjectFilter(this.normalizeProjectCodes(projectCodes));
        const translations = await Translation_1.default.find(filter).sort('id');
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('翻译数据');
        const cols = [];
        if (includeId)
            cols.push({ header: "翻译项ID", key: "id", width: 20 });
        cols.push({ header: "翻译项", key: "zh-CN", width: 30 }, { header: "翻译项-英文", key: "en-US", width: 30 }, { header: "翻译项-繁体", key: "zh-HK", width: 30 });
        if (includeProject)
            cols.push({ header: "所属项目", key: "projectCode", width: 40 });
        worksheet.columns = cols;
        translations.forEach(translation => {
            const rowData = {
                'zh-CN': translation.source || '',
                'en-US': translation.target['en-US'] || '',
                'zh-HK': translation.target['zh-HK'] || ''
            };
            if (includeId)
                rowData.id = translation.id;
            if (includeProject) {
                rowData.projectCode = Array.isArray(translation.projectCode) && translation.projectCode.length > 0
                    ? translation.projectCode.join(',')
                    : '';
            }
            worksheet.addRow(rowData);
        });
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        return workbook;
    }
    async batchImport(fileBuffer, fileName = '') {
        let parsedData;
        if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
            throw new Error('只支持Excel文件(.xlsx/.xls)');
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('Excel文件中没有找到工作表');
        }
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value;
        });
        const data = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] = cell.value || '';
                }
            });
            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });
        parsedData = { data, errors: [] };
        if (parsedData.errors.length > 0) {
            throw new Error('文件格式错误');
        }
        const results = {
            data: [],
            total: 0,
            success: 0,
            errors: [],
            hasDuplicates: false
        };
        const existingTranslations = await Translation_1.default.find();
        const existingSources = new Set(existingTranslations.map(item => item.source));
        const internalSet = new Set();
        const validData = [];
        let hasDuplicateIssues = false;
        for (let i = 0; i < parsedData.data.length; i++) {
            const row = parsedData.data[i];
            results.total++;
            const cellValue = row.Source || row['翻译项'];
            if (!cellValue || (typeof cellValue === 'string' && cellValue.trim() === '')) {
                results.errors.push({
                    row: i + 2,
                    message: '翻译项不能为空'
                });
                hasDuplicateIssues = true;
                continue;
            }
            if (internalSet.has(cellValue)) {
                results.errors.push({
                    row: i + 2,
                    message: 'Excel内部重复：该翻译项在表格中已存在'
                });
                hasDuplicateIssues = true;
                continue;
            }
            internalSet.add(cellValue);
            if (existingSources.has(cellValue)) {
                results.errors.push({
                    row: i + 2,
                    message: '数据库中已存在：该翻译项在数据库中已存在'
                });
                hasDuplicateIssues = true;
                continue;
            }
            let projectCode = [];
            const projectCell = row['所属项目'] || row.projectCode;
            if (projectCell != null && String(projectCell).trim() !== '') {
                projectCode = String(projectCell).split(',').map((c) => c.trim()).filter(Boolean);
            }
            validData.push({
                rowIndex: i + 2,
                data: {
                    source: cellValue,
                    'en-US': row['翻译项-英文'] || row['target(en-US)'] || '',
                    'zh-HK': row['翻译项-繁体'] || row['target(zh-HK)'] || '',
                    projectCode
                }
            });
        }
        if (hasDuplicateIssues) {
            results.hasDuplicates = true;
            return {
                code: 200,
                data: results,
                message: `检测到重复问题，已阻止数据导入。共 ${results.total} 条数据，发现 ${results.errors.length} 个问题，请修正后重新导入。`
            };
        }
        try {
            for (const item of validData) {
                try {
                    const id = await this.generateNewId();
                    const translation = new Translation_1.default({
                        id,
                        source: item.data.source,
                        target: {
                            'zh-CN': item.data.source,
                            'en-US': item.data['en-US'],
                            'zh-HK': item.data['zh-HK']
                        },
                        projectCode: item.data.projectCode || []
                    });
                    await translation.save();
                    results.data.push(translation);
                    results.success++;
                }
                catch (error) {
                    results.errors.push({
                        row: item.rowIndex,
                        message: `保存失败: ${error instanceof Error ? error.message : '未知错误'}`
                    });
                }
            }
        }
        catch (error) {
            throw new Error(`批量保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
        return {
            code: 200,
            data: results,
            message: `导入成功！共 ${results.total} 条数据，成功导入 ${results.success} 条数据。`
        };
    }
    downloadUpdateTemplate() {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('批量修改模板');
        worksheet.columns = [
            { header: "翻译项ID", key: "id", width: 20 },
            { header: "翻译项", key: "zh-CN", width: 30 },
            { header: "翻译项-英文", key: "en-US", width: 30 },
            { header: "翻译项-繁体", key: "zh-HK", width: 30 },
            { header: "所属项目", key: "projectCode", width: 40 },
        ];
        return workbook;
    }
    async batchUpdate(fileBuffer, fileName = '') {
        let parsedData;
        if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
            throw new Error('只支持Excel文件(.xlsx/.xls)');
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('Excel文件中没有找到工作表');
        }
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value;
        });
        const data = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] = cell.value || '';
                }
            });
            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });
        parsedData = { data, errors: [] };
        if (parsedData.errors.length > 0) {
            throw new Error('文件格式错误');
        }
        const results = {
            total: 0,
            success: 0,
            errors: [],
            successItems: []
        };
        const existingTranslations = await Translation_1.default.find();
        const existingIds = new Set(existingTranslations.map(item => item.id));
        for (let i = 0; i < parsedData.data.length; i++) {
            const row = parsedData.data[i];
            results.total++;
            const translationId = row.ID || row['翻译项ID'];
            const source = row.Source || row['翻译项'];
            if (!translationId) {
                results.errors.push({
                    row: i + 2,
                    message: '翻译项ID不能为空'
                });
                continue;
            }
            if (!existingIds.has(translationId)) {
                results.errors.push({
                    row: i + 2,
                    message: `翻译项ID "${translationId}" 不存在`
                });
                continue;
            }
            try {
                let projectCode = [];
                const projectCell = row['所属项目'] || row.projectCode;
                if (projectCell != null && String(projectCell).trim() !== '') {
                    projectCode = String(projectCell).split(',').map((c) => c.trim()).filter(Boolean);
                }
                const updateData = {
                    source: source || '',
                    target: {
                        'zh-CN': source || '',
                        'en-US': row['翻译项-英文'] || row['target(en-US)'] || '',
                        'zh-HK': row['翻译项-繁体'] || row['target(zh-HK)'] || ''
                    },
                    projectCode
                };
                if (!updateData.source) {
                    throw new Error('翻译项内容不能为空');
                }
                const oldDoc = await Translation_1.default.findOne({ id: translationId });
                const updatedTranslation = await Translation_1.default.findOneAndUpdate({ id: translationId }, updateData, { new: true, runValidators: true });
                if (!updatedTranslation) {
                    throw new Error('更新失败');
                }
                results.success++;
                results.successItems.push({
                    id: updatedTranslation.id,
                    prevSource: oldDoc?.source || '',
                    prevEnUS: oldDoc?.target?.['en-US'] || '',
                    prevZhHK: oldDoc?.target?.['zh-HK'] || '',
                    prevProjectCode: Array.isArray(oldDoc?.projectCode) ? oldDoc.projectCode : [],
                    source: updatedTranslation.source,
                    "en-US": updatedTranslation.target["en-US"] || "",
                    "zh-HK": updatedTranslation.target["zh-HK"] || "",
                    projectCode: Array.isArray(updatedTranslation.projectCode)
                        ? updatedTranslation.projectCode
                        : [],
                });
            }
            catch (error) {
                results.errors.push({
                    row: i + 2,
                    message: error instanceof Error ? error.message : '未知错误'
                });
            }
        }
        return {
            code: 200,
            data: results,
            message: `批量修改 ${results.total} 条数据，成功修改 ${results.success} 条数据，失败 ${results.errors.length} 条数据`
        };
    }
    async batchGetIds(fileBuffer, fileName = '') {
        let parsedData;
        if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
            throw new Error('只支持Excel文件(.xlsx/.xls)');
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('Excel文件中没有找到工作表');
        }
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value;
        });
        const data = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] = cell.value || '';
                }
            });
            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });
        parsedData = { data, errors: [] };
        if (parsedData.errors.length > 0) {
            throw new Error('文件格式错误');
        }
        const results = {
            total: 0,
            success: 0,
            errors: [],
            data: []
        };
        for (let i = 0; i < parsedData.data.length; i++) {
            const row = parsedData.data[i];
            results.total++;
            const source = row.Source || row['翻译项'];
            if (!source) {
                results.errors.push({
                    row: i + 2,
                    message: '翻译项不能为空'
                });
                continue;
            }
            try {
                const translation = await Translation_1.default.findOne({ source: source });
                if (!translation) {
                    results.errors.push({
                        row: i + 2,
                        message: `翻译项在数据库中不存在`
                    });
                    continue;
                }
                const resultItem = {
                    id: translation.id,
                    source: translation.source,
                    'en-US': translation.target['en-US'] || '',
                    'zh-HK': translation.target['zh-HK'] || ''
                };
                results.data.push(resultItem);
                results.success++;
            }
            catch (error) {
                results.errors.push({
                    row: i + 2,
                    message: error instanceof Error ? error.message : '未知错误'
                });
            }
        }
        return {
            code: 200,
            data: results,
            message: `批量获取 ${results.total} 条数据，成功获取 ${results.success} 条翻译项ID，失败获取 ${results.errors.length} 条翻译项ID`
        };
    }
    downloadGetIdsTemplate() {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('批量获取ID模板');
        worksheet.columns = [
            { header: "翻译项", key: "zh-CN", width: 30 },
            { header: "翻译项-英文", key: "en-US", width: 30 },
            { header: "翻译项-繁体", key: "zh-HK", width: 30 },
        ];
        return workbook;
    }
    async exportGetIdsResult(data) {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('翻译项ID结果', {
            properties: {
                defaultRowHeight: 15
            },
            views: [{ showGridLines: false }]
        });
        worksheet.columns = [
            { header: "翻译项ID", key: "id", width: 20 },
            { header: "翻译项", key: "zh-CN", width: 30 },
            { header: "翻译项-英文", key: "en-US", width: 30 },
            { header: "翻译项-繁体", key: "zh-HK", width: 30 },
        ];
        const rows = data.map(item => [
            item.id || '',
            item.source || '',
            item['en-US'] || '',
            item['zh-HK'] || ''
        ]);
        worksheet.addRows(rows);
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        return workbook;
    }
    downloadDeleteTemplate() {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('批量删除模板');
        worksheet.columns = [
            { header: "翻译项ID", key: "id", width: 20 },
            { header: "翻译项", key: "source", width: 30 },
            { header: "翻译项-英文", key: "en-US", width: 30 },
            { header: "翻译项-繁体", key: "zh-HK", width: 30 },
        ];
        return workbook;
    }
    async batchDelete(fileBuffer, fileName = '') {
        let parsedData;
        if (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls')) {
            throw new Error('只支持Excel文件(.xlsx/.xls)');
        }
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            throw new Error('Excel文件中没有找到工作表');
        }
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value;
        });
        const data = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] = cell.value || '';
                }
            });
            if (Object.keys(rowData).length > 0) {
                data.push(rowData);
            }
        });
        parsedData = { data, errors: [] };
        if (parsedData.errors.length > 0) {
            throw new Error('文件格式错误');
        }
        const results = {
            total: 0,
            success: 0,
            errors: [],
            successItems: []
        };
        const existingTranslations = await Translation_1.default.find();
        const existingIds = new Set(existingTranslations.map(item => item.id));
        for (let i = 0; i < parsedData.data.length; i++) {
            const row = parsedData.data[i];
            results.total++;
            const translationId = row.ID || row['翻译项ID'] || row.id;
            if (!translationId) {
                results.errors.push({
                    row: i + 2,
                    message: '翻译项ID不能为空'
                });
                continue;
            }
            if (!existingIds.has(translationId)) {
                results.errors.push({
                    row: i + 2,
                    message: `翻译项ID "${translationId}" 不存在`
                });
                continue;
            }
            try {
                const deletedTranslation = await Translation_1.default.findOneAndDelete({ id: translationId });
                if (!deletedTranslation) {
                    throw new Error('删除失败');
                }
                results.success++;
                results.successItems.push({
                    id: deletedTranslation.id,
                    prevSource: '',
                    prevEnUS: '',
                    prevZhHK: '',
                    prevProjectCode: [],
                    source: deletedTranslation.source,
                    "en-US": deletedTranslation.target["en-US"] || "",
                    "zh-HK": deletedTranslation.target["zh-HK"] || "",
                    projectCode: Array.isArray(deletedTranslation.projectCode)
                        ? deletedTranslation.projectCode
                        : [],
                });
            }
            catch (error) {
                results.errors.push({
                    row: i + 2,
                    message: error instanceof Error ? error.message : '未知错误'
                });
            }
        }
        return {
            code: 200,
            data: results,
            message: `批量删除 ${results.total} 条数据，成功删除 ${results.success} 条数据，失败 ${results.errors.length} 条数据`
        };
    }
    async batchTagByJson(fileBuffer, fileName = '', projectCodeInput) {
        if (!fileName.toLowerCase().endsWith('.json')) {
            throw new Error('只支持JSON文件(.json)');
        }
        const selectedProjectCodes = Array.isArray(projectCodeInput)
            ? projectCodeInput.map((c) => String(c).trim()).filter(Boolean)
            : String(projectCodeInput || '')
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean);
        if (selectedProjectCodes.length === 0) {
            throw new Error('请选择要打的所属项目标签');
        }
        let payload;
        try {
            const content = fileBuffer.toString('utf-8');
            payload = JSON.parse(content);
        }
        catch (error) {
            throw new Error('JSON文件解析失败，请检查格式');
        }
        let idList = [];
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && !Array.isArray(payload?.data)) {
            idList = Object.keys(payload).map((k) => k.trim()).filter(Boolean);
        }
        else {
            const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
            idList = rawItems.map((row) => String(row?.id || row?.translationId || '').trim()).filter(Boolean);
        }
        if (!Array.isArray(idList) || idList.length === 0) {
            throw new Error('JSON内容为空，或格式不正确（应包含翻译项ID）');
        }
        const results = {
            total: 0,
            success: 0,
            errors: [],
            successItems: [],
        };
        for (let i = 0; i < idList.length; i++) {
            const translationId = idList[i];
            results.total++;
            if (!translationId) {
                results.errors.push({
                    row: i + 1,
                    message: '翻译项ID不能为空',
                });
                continue;
            }
            try {
                const oldDoc = await Translation_1.default.findOne({ id: translationId });
                if (!oldDoc) {
                    results.errors.push({
                        row: i + 1,
                        message: `翻译项ID "${translationId}" 不存在`,
                    });
                    continue;
                }
                const updatedTranslation = await Translation_1.default.findOneAndUpdate({ id: translationId }, { projectCode: selectedProjectCodes }, { new: true, runValidators: true });
                if (!updatedTranslation) {
                    results.errors.push({
                        row: i + 1,
                        message: `翻译项ID "${translationId}" 不存在`,
                    });
                    continue;
                }
                results.success++;
                results.successItems.push({
                    id: updatedTranslation.id,
                    prevSource: oldDoc.source || '',
                    prevEnUS: oldDoc.target?.['en-US'] || '',
                    prevZhHK: oldDoc.target?.['zh-HK'] || '',
                    prevProjectCode: Array.isArray(oldDoc.projectCode) ? oldDoc.projectCode : [],
                    source: updatedTranslation.source,
                    "en-US": updatedTranslation.target["en-US"] || "",
                    "zh-HK": updatedTranslation.target["zh-HK"] || "",
                    projectCode: Array.isArray(updatedTranslation.projectCode)
                        ? updatedTranslation.projectCode
                        : [],
                });
            }
            catch (error) {
                results.errors.push({
                    row: i + 1,
                    message: error instanceof Error ? error.message : '未知错误',
                });
            }
        }
        return {
            code: 200,
            data: results,
            message: `批量打标签 ${results.total} 条数据，成功 ${results.success} 条，失败 ${results.errors.length} 条`,
        };
    }
}
exports.default = new TranslationService();
//# sourceMappingURL=translationService.js.map