"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("../middleware/auth"));
const OperationLog_1 = __importDefault(require("../models/OperationLog"));
const router = express_1.default.Router();
router.use(auth_1.default);
router.get("/", async (req, res) => {
    try {
        const { page = "1", pageSize = "10", logId, username, operationType, startTime, endTime, } = req.query;
        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const size = Math.max(1, parseInt(pageSize, 10) || 10);
        const query = {};
        if (logId && String(logId).trim()) {
            const idStr = String(logId).trim();
            if (!mongoose_1.default.Types.ObjectId.isValid(idStr)) {
                const response = {
                    status: 200,
                    message: "success",
                    data: {
                        data: [],
                        total: 0,
                        page: currentPage,
                        pageSize: size,
                        totalPages: 0,
                    },
                };
                return res.status(200).json(response);
            }
            query._id = new mongoose_1.default.Types.ObjectId(idStr);
        }
        if (username && String(username).trim()) {
            query.username = String(username).trim();
        }
        if (operationType && String(operationType).trim()) {
            query.operationType = String(operationType).trim();
        }
        if (startTime || endTime) {
            query.createdAt = {};
            if (startTime) {
                query.createdAt.$gte = new Date(String(startTime));
            }
            if (endTime) {
                query.createdAt.$lte = new Date(String(endTime));
            }
        }
        const [list, total] = await Promise.all([
            OperationLog_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * size)
                .limit(size),
            OperationLog_1.default.countDocuments(query),
        ]);
        const response = {
            status: 200,
            message: "success",
            data: {
                data: list.map((item) => ({
                    id: item._id,
                    username: item.username,
                    operationType: item.operationType,
                    summary: item.summary || "",
                    detailCount: item.detailItems?.length || 0,
                    createdAt: item.createdAt,
                })),
                total,
                page: currentPage,
                pageSize: size,
                totalPages: Math.ceil(total / size),
            },
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : "查询操作日志失败",
            data: "",
        };
        return res.status(400).json(response);
    }
});
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const log = await OperationLog_1.default.findById(id);
        if (!log) {
            return res.status(404).json({
                status: 404,
                message: "日志不存在",
                data: "",
            });
        }
        const response = {
            status: 200,
            message: "success",
            data: {
                id: log._id,
                username: log.username,
                operationType: log.operationType,
                summary: log.summary || "",
                detailItems: log.detailItems || [],
                createdAt: log.createdAt,
            },
        };
        return res.status(200).json(response);
    }
    catch (error) {
        return res.status(400).json({
            status: 400,
            message: error instanceof Error ? error.message : "查询操作日志详情失败",
            data: "",
        });
    }
});
exports.default = router;
//# sourceMappingURL=operationLogs.js.map