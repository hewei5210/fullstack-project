"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const translationService_1 = __importDefault(require("../services/translationService"));
const auth_1 = __importDefault(require("../middleware/auth"));
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(auth_1.default);
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
        const result = await translationService_1.default.update(req.body);
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
        const { langType = 'zh-CN' } = req.query;
        const fileInfo = await translationService_1.default.exportJsonData(langType);
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
        const { includeId = false } = req.query;
        const workbook = await translationService_1.default.exportExcelData(includeId === 'true');
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