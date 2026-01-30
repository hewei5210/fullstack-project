"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = __importDefault(require("../services/authService"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 401,
                message: '未提供认证令牌'
            });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = authService_1.default.verifyToken(token);
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            status: 401,
            message: '认证失败'
        });
    }
};
exports.default = authMiddleware;
//# sourceMappingURL=auth.js.map