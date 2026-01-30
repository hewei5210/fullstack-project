"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authService_1 = __importDefault(require("../services/authService"));
const router = express_1.default.Router();
router.post('/login', async (req, res) => {
    try {
        const result = await authService_1.default.login(req.body);
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
            message: error instanceof Error ? error.message : '认证失败',
            data: ''
        };
        return res.status(400).json(response);
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            const response = {
                status: 400,
                message: '刷新token不能为空',
                data: ''
            };
            return res.status(400).json(response);
        }
        const result = await authService_1.default.refreshToken(refreshToken);
        const response = {
            status: 200,
            message: 'token刷新成功',
            data: result
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 400,
            message: error instanceof Error ? error.message : '刷新失败',
            data: ''
        };
        return res.status(400).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map