"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.get('/', auth_1.default, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const searchType = req.query.searchType;
        const searchKeyword = req.query.searchKeyword;
        const roleFilter = req.query.roleFilter;
        const query = {};
        if (searchKeyword && searchType) {
            switch (searchType) {
                case 'username':
                    query.username = { $regex: searchKeyword, $options: 'i' };
                    break;
                case 'email':
                    query.email = { $regex: searchKeyword, $options: 'i' };
                    break;
                case 'phone':
                    query.phone = { $regex: searchKeyword, $options: 'i' };
                    break;
            }
        }
        if (roleFilter) {
            query.role = roleFilter;
        }
        const skip = (page - 1) * pageSize;
        const total = await User_1.default.countDocuments(query);
        const users = await User_1.default.find(query, { password: 0 })
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 });
        const response = {
            status: 200,
            message: '获取用户列表成功',
            data: {
                users,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('获取用户列表失败:', error);
        const response = {
            status: 500,
            message: '获取用户列表失败',
            data: ''
        };
        res.status(500).json(response);
    }
});
router.post('/', auth_1.default, async (req, res) => {
    try {
        const { username, email, phone, password, role } = req.body;
        const existingUser = await User_1.default.findOne({ username });
        if (existingUser) {
            const response = {
                status: 400,
                message: '用户名已存在',
                data: ''
            };
            return res.status(400).json(response);
        }
        if (email) {
            const existingEmail = await User_1.default.findOne({ email });
            if (existingEmail) {
                const response = {
                    status: 400,
                    message: '邮箱已存在',
                    data: ''
                };
                return res.status(400).json(response);
            }
        }
        if (phone) {
            const existingPhone = await User_1.default.findOne({ phone });
            if (existingPhone) {
                const response = {
                    status: 400,
                    message: '手机号已存在',
                    data: ''
                };
                return res.status(400).json(response);
            }
        }
        const newUser = new User_1.default({
            username,
            email: email || `no-email-${username}-${Date.now()}`,
            phone: phone || `no-phone-${username}-${Date.now()}`,
            password,
            role: role || 'user'
        });
        await newUser.save();
        const userResponse = {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            createdAt: newUser.createdAt
        };
        const response = {
            status: 201,
            message: '用户创建成功',
            data: userResponse
        };
        return res.status(201).json(response);
    }
    catch (error) {
        console.error('创建用户失败:', error);
        const response = {
            status: 500,
            message: `创建用户失败: ${error instanceof Error ? error.message : '未知错误'}`,
            data: ''
        };
        return res.status(500).json(response);
    }
});
router.put('/:username', auth_1.default, async (req, res) => {
    try {
        const { username } = req.params;
        const { email, phone, role } = req.body;
        const user = await User_1.default.findOne({ username });
        if (!user) {
            const response = {
                status: 404,
                message: '用户不存在',
                data: ''
            };
            return res.status(404).json(response);
        }
        if (email && email !== user.email) {
            const existingEmail = await User_1.default.findOne({ email, _id: { $ne: user._id } });
            if (existingEmail) {
                const response = {
                    status: 400,
                    message: '邮箱已被其他用户使用',
                    data: ''
                };
                return res.status(400).json(response);
            }
        }
        if (phone && phone !== user.phone) {
            const existingPhone = await User_1.default.findOne({ phone, _id: { $ne: user._id } });
            if (existingPhone) {
                const response = {
                    status: 400,
                    message: '手机号已被其他用户使用',
                    data: ''
                };
                return res.status(400).json(response);
            }
        }
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.role = role || user.role;
        await user.save();
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt
        };
        const response = {
            status: 200,
            message: '用户更新成功',
            data: userResponse
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 500,
            message: '更新用户失败',
            data: ''
        };
        return res.status(500).json(response);
    }
});
router.delete('/:username', auth_1.default, async (req, res) => {
    try {
        const { username } = req.params;
        if (username === 'admin') {
            const response = {
                status: 400,
                message: '不能删除管理员用户',
                data: ''
            };
            return res.status(400).json(response);
        }
        const user = await User_1.default.findOneAndDelete({ username });
        if (!user) {
            const response = {
                status: 404,
                message: '用户不存在',
                data: ''
            };
            return res.status(404).json(response);
        }
        const response = {
            status: 200,
            message: '用户删除成功',
            data: ''
        };
        return res.status(200).json(response);
    }
    catch (error) {
        const response = {
            status: 500,
            message: '删除用户失败',
            data: ''
        };
        return res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map