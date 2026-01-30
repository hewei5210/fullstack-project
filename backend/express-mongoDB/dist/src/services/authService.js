"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = process.env.JWT_SECRET || 'your_ultra_secure_secret';
const TOKEN_EXPIRES = '2h';
const REFRESH_TOKEN_EXPIRES = '7d';
class AuthService {
    async login(credentials) {
        const { username, password } = credentials;
        const user = await User_1.default.findOne({ username });
        if (!user) {
            throw new Error('用户名或密码错误');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('用户名或密码错误');
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: TOKEN_EXPIRES });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id, type: 'refresh' }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRES });
        return {
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        };
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, SECRET_KEY);
        }
        catch (error) {
            throw new Error('Token无效');
        }
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, SECRET_KEY);
            if (decoded.type !== 'refresh') {
                throw new Error('无效的刷新token');
            }
            const user = await User_1.default.findById(decoded.userId);
            if (!user) {
                throw new Error('用户不存在');
            }
            const newAccessToken = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: TOKEN_EXPIRES });
            const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user._id, type: 'refresh' }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRES });
            return {
                token: newAccessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            throw new Error('刷新token失败');
        }
    }
    isTokenExpiringSoon(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return false;
            }
            const now = Math.floor(Date.now() / 1000);
            const expiresIn = decoded.exp - now;
            return expiresIn <= 300;
        }
        catch (error) {
            return false;
        }
    }
}
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map