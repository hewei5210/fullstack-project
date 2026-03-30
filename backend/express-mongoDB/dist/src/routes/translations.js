"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const translationService_1 = __importDefault(require("../services/translationService"));
const auth_1 = __importDefault(require("../middleware/auth"));
const multer_1 = __importDefault(require("multer"));
const OperationLog_1 = __importDefault(require("../models/OperationLog"));
const Translation_1 = __importDefault(require("../models/Translation"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const toDetailItem = (item) => ({
    translationId: item?.id || item?.translationId || '',
    source: item?.source || item?.target?.['zh-CN'] || '',
    enUS: item?.['en-US'] !== undefined && item?.['en-US'] !== null
        ? item['en-US']
        : item?.target?.['en-US'] || '',
    zhHK: item?.['zh-HK'] !== undefined && item?.['zh-HK'] !== null
        ? item['zh-HK']
        : item?.target?.['zh-HK'] || '',
    prevSource: item?.prevSource ?? '',
    prevEnUS: item?.prevEnUS ?? '',
    prevZhHK: item?.prevZhHK ?? '',
    prevProjectCode: Array.isArray(item?.prevProjectCode) ? item.prevProjectCode : [],
    projectCode: Array.isArray(item?.projectCode) ? item.projectCode : [],
});
const writeOperationLog = async (req, operationType, detailItems, summary) => {
    try {
        await OperationLog_1.default.create({
            username: req.user?.username || 'unknown',
            operationType,
            summary,
            detailItems,
        });
    }
    catch (error) {
        console.error('写入操作日志失败:', error);
    }
};
router.use(auth_1.default);
router.get('/projectTags', async (_req, res) => {
    try {
        const list = await translationService_1.default.getProjectTags();
        const response = {
            status: 200,
            message: 'success',
            data: list
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : '获取失败',
            data: ''
        };
        return res.status(400).json(response);
    }
});
router.get('/getBingList', async (req, res) => {
    try {
        const result = await translationService_1.default.getList(req.query);
        const response = {
            status: 200,
            message: 'success',
            data: result
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : '获取失败',
            data: ''
        };
        return res.status(400).json(response);
    }
});
router.get('/search', async (req, res) => {
    try {
        const result = await translationService_1.default.search(req.query);
        const response = {
            status: 200,
            message: 'success',
            data: result
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : '搜索失败',
            data: ''
        };
        return res.status(400).json(response);
    }
});
router.post('/addBing', async (req, res) => {
    try {
        const result = await translationService_1.default.add(req.body);
        await writeOperationLog(req, '新增翻译项', [toDetailItem(result)], `新增 1 条翻译项`);
        const response = {
            status: 200,
            message: '添加成功',
            data: result
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : '添加失败',
            data: ''
        };
        return res.status(400).json(response);
    }
});
router.put('/updateBing', async (req, res) => {
    try {
        const editId = req.body?.id;
        const beforeDoc = editId ? await Translation_1.default.findOne({ id: editId }) : null;
        const result = await translationService_1.default.update(req.body);
        const detailItem = {
            ...toDetailItem(result),
            prevSource: beforeDoc?.source || '',
            prevEnUS: beforeDoc?.target?.['en-US'] || '',
            prevZhHK: beforeDoc?.target?.['zh-HK'] || '',
            prevProjectCode: Array.isArray(beforeDoc?.projectCode) ? beforeDoc.projectCode : [],
        };
        await writeOperationLog(req, '编辑翻译项', [detailItem], `编辑 1 条翻译项`);
        const response = {
            status: 200,
            message: '更新成功',
            data: result
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : '更新失败',
            data: ''
        };
        return res.status(400).json(response);
    }
});
router.delete('/delBing', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({
                status: 400,
                message: '翻译项ID不能为空',
                data: ''
            });
        }
        const result = await translationService_1.default.delete(id);
        await writeOperationLog(req, '删除翻译项', [toDetailItem(result)], `删除 1 条翻译项`);
        return res.status(200).json({
            status: 200,
            message: 'success',
            data: result
        });
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '删除失败',
            data: ''
        });
    }
});
router.get('/exportBing', async (req, res) => {
    try {
        const { langType = 'zh-CN', projectCodes } = req.query;
        const codes = typeof projectCodes === 'string' && projectCodes
            ? projectCodes.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined;
        const fileInfo = await translationService_1.default.exportJsonData(langType, codes);
        const fs = require('fs');
        if (!fs.existsSync(fileInfo.filePath)) {
            throw new Error('导出文件不存在');
        }
        const fileContent = fs.readFileSync(fileInfo.filePath, 'utf8');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
        res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');
        res.send(fileContent);
        setTimeout(() => {
            try {
                fileInfo.done();
            }
            catch (error) {
                console.error('清理临时文件失败:', error);
            }
        }, 2000);
        return;
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '导出失败',
            data: ''
        });
    }
});
router.get('/exportExcel', async (req, res) => {
    try {
        const { includeId = false, includeProject = false, projectCodes } = req.query;
        const codes = typeof projectCodes === 'string' && projectCodes
            ? projectCodes.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined;
        const workbook = await translationService_1.default.exportExcelData(includeId === 'true', includeProject === 'true', codes);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=translation_data.xlsx');
        await workbook.xlsx.write(res);
        return;
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '导出失败',
            data: ''
        });
    }
});
router.get('/downloadTemplate', async (req, res) => {
    try {
        const workbook = translationService_1.default.downloadTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=translation_template.xlsx');
        await workbook.xlsx.write(res);
        return;
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '下载失败',
            data: ''
        });
    }
});
router.post('/batchUpload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 400,
                message: '请上传文件',
                data: ''
            });
        }
        const result = await translationService_1.default.batchImport(req.file.buffer, req.file.originalname);
        const successItems = Array.isArray(result?.data?.data)
            ? result.data.data.map((item) => toDetailItem(item))
            : [];
        await writeOperationLog(req, '批量新增翻译项', successItems, `批量新增：成功 ${result?.data?.success || 0} 条，失败 ${result?.data?.errors?.length || 0} 条`);
        const statusCode = result.code === 200 ? 200 : 400;
        return res.status(statusCode).json({
            status: result.code,
            message: result.message,
            data: result.data
        });
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '批量上传失败',
            data: ''
        });
    }
});
router.post('/batchUpdate', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 400,
                message: '请上传文件',
                data: ''
            });
        }
        const result = await translationService_1.default.batchUpdate(req.file.buffer, req.file.originalname);
        const successItems = Array.isArray(result?.data?.successItems)
            ? result.data.successItems.map((item) => toDetailItem(item))
            : [];
        await writeOperationLog(req, '批量编辑翻译项', successItems, `批量编辑：成功 ${result?.data?.success || 0} 条，失败 ${result?.data?.errors?.length || 0} 条`);
        return res.status(200).json({
            status: 200,
            message: result.message,
            data: result.data
        });
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '批量修改失败',
            data: ''
        });
    }
});
router.post('/batchGetIds', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 400,
                message: '请上传文件',
                data: ''
            });
        }
        const result = await translationService_1.default.batchGetIds(req.file.buffer, req.file.originalname);
        return res.status(200).json({
            status: 200,
            message: result.message,
            data: result.data
        });
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '批量获取ID失败',
            data: ''
        });
    }
});
router.post('/batchTagByJson', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 400,
                message: '请上传文件',
                data: ''
            });
        }
        const result = await translationService_1.default.batchTagByJson(req.file.buffer, req.file.originalname, req.body?.projectCode);
        const successItems = Array.isArray(result?.data?.successItems)
            ? result.data.successItems.map((item) => toDetailItem(item))
            : [];
        await writeOperationLog(req, '批量编辑翻译项', successItems, `批量打标签：成功 ${result?.data?.success || 0} 条，失败 ${result?.data?.errors?.length || 0} 条`);
        return res.status(200).json({
            status: 200,
            message: result.message,
            data: result.data
        });
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '批量打标签失败',
            data: ''
        });
    }
});
router.post('/exportGetIdsResult', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                status: 400,
                message: '数据格式错误',
                data: ''
            });
        }
        if (data.length > 10000) {
            return res.status(400).json({
                status: 400,
                message: `数据量过大（${data.length}条），请分批导出，每次最多10000条`,
                data: ''
            });
        }
        console.log(`开始导出 ${data.length} 条数据的Excel文件...`);
        const workbook = await translationService_1.default.exportGetIdsResult(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=translation_ids_result.xlsx');
        await workbook.xlsx.write(res);
        console.log(`Excel文件导出成功，共 ${data.length} 条数据`);
        return;
    }
    catch (error) {
        console.error('导出Excel文件失败:', error);
        return res.status(500).json({
            status: 500,
            message: error instanceof Error ? error.message : '服务器内部错误',
            data: ''
        });
    }
});
router.get('/downloadUpdateTemplate', async (req, res) => {
    try {
        const workbook = translationService_1.default.downloadUpdateTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=translation_update_template.xlsx');
        await workbook.xlsx.write(res);
        return;
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '下载失败',
            data: ''
        });
    }
});
router.get('/downloadGetIdsTemplate', async (req, res) => {
    try {
        const workbook = translationService_1.default.downloadGetIdsTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=translation_get_ids_template.xlsx');
        await workbook.xlsx.write(res);
        return;
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '下载失败',
            data: ''
        });
    }
});
router.post('/batchDelete', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 400,
                message: '请上传文件',
                data: ''
            });
        }
        const result = await translationService_1.default.batchDelete(req.file.buffer, req.file.originalname);
        const successItems = Array.isArray(result?.data?.successItems)
            ? result.data.successItems.map((item) => toDetailItem(item))
            : [];
        await writeOperationLog(req, '批量删除翻译项', successItems, `批量删除：成功 ${result?.data?.success || 0} 条，失败 ${result?.data?.errors?.length || 0} 条`);
        return res.status(200).json({
            status: 200,
            message: result.message,
            data: result.data
        });
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '批量删除失败',
            data: ''
        });
    }
});
router.get('/downloadDeleteTemplate', async (req, res) => {
    try {
        const workbook = translationService_1.default.downloadDeleteTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=translation_delete_template.xlsx');
        await workbook.xlsx.write(res);
        return;
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : '下载失败',
            data: ''
        });
    }
});
exports.default = router;
//# sourceMappingURL=translations.js.map