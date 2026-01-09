import express, { Response } from 'express';
import User from '../models/User';
import authMiddleware from '../middleware/auth';
import { IAuthenticatedRequest, IApiResponse } from '../types';

const router = express.Router();

// 获取用户列表（支持分页、搜索和筛选）
router.get('/', authMiddleware, async (req: IAuthenticatedRequest, res: Response) => {
  try {
    // 获取查询参数
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const searchType = req.query.searchType as string; // username, email, phone
    const searchKeyword = req.query.searchKeyword as string;
    const roleFilter = req.query.roleFilter as string; // admin, user

    // 构建查询条件
    const query: any = {};

    // 搜索条件
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

    // 角色筛选
    if (roleFilter) {
      query.role = roleFilter;
    }

    // 计算跳过的记录数
    const skip = (page - 1) * pageSize;

    // 查询总数
    const total = await User.countDocuments(query);

    // 查询分页数据
    const users = await User.find(query, { password: 0 })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }); // 按创建时间倒序

    // 返回分页数据
    const response: IApiResponse = {
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
  } catch (error) {
    console.error('获取用户列表失败:', error);
    const response: IApiResponse = {
      status: 500,
      message: '获取用户列表失败',
      data: ''
    };
    res.status(500).json(response);
  }
});

// 创建用户
router.post('/', authMiddleware, async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { username, email, phone, password, role } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      const response: IApiResponse = {
        status: 400,
        message: '用户名已存在',
        data: ''
      };
      return res.status(400).json(response);
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        const response: IApiResponse = {
          status: 400,
          message: '邮箱已存在',
          data: ''
        };
        return res.status(400).json(response);
      }
    }

    // 检查手机号是否已存在（如果提供了手机号）
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        const response: IApiResponse = {
          status: 400,
          message: '手机号已存在',
          data: ''
        };
        return res.status(400).json(response);
      }
    }

    const newUser = new User({
      username,
      email: email || `no-email-${username}-${Date.now()}`,
      phone: phone || `no-phone-${username}-${Date.now()}`,
      password,
      role: role || 'user'
    });

    await newUser.save();
    
    // 返回用户信息（不包含密码）
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    const response: IApiResponse = {
      status: 201,
      message: '用户创建成功',
      data: userResponse
    };
    return res.status(201).json(response);
  } catch (error) {
    console.error('创建用户失败:', error);
    const response: IApiResponse = {
      status: 500,
      message: `创建用户失败: ${error instanceof Error ? error.message : '未知错误'}`,
      data: ''
    };
    return res.status(500).json(response);
  }
});

// 更新用户
router.put('/:username', authMiddleware, async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { email, phone, role } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      const response: IApiResponse = {
        status: 404,
        message: '用户不存在',
        data: ''
      };
      return res.status(404).json(response);
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        const response: IApiResponse = {
          status: 400,
          message: '邮箱已被其他用户使用',
          data: ''
        };
        return res.status(400).json(response);
      }
    }

    // 检查手机号是否已被其他用户使用
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existingPhone) {
        const response: IApiResponse = {
          status: 400,
          message: '手机号已被其他用户使用',
          data: ''
        };
        return res.status(400).json(response);
      }
    }

    // 更新用户信息
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    
    await user.save();
    
    // 返回更新后的用户信息（不包含密码）
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };

    const response: IApiResponse = {
      status: 200,
      message: '用户更新成功',
      data: userResponse
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 500,
      message: '更新用户失败',
      data: ''
    };
    return res.status(500).json(response);
  }
});

// 删除用户
router.delete('/:username', authMiddleware, async (req: IAuthenticatedRequest, res: Response) => {
  try {
    const { username } = req.params;
    
    // 不允许删除 admin 用户
    if (username === 'admin') {
      const response: IApiResponse = {
        status: 400,
        message: '不能删除管理员用户',
        data: ''
      };
      return res.status(400).json(response);
    }

    const user = await User.findOneAndDelete({ username });
    if (!user) {
      const response: IApiResponse = {
        status: 404,
        message: '用户不存在',
        data: ''
      };
      return res.status(404).json(response);
    }

    const response: IApiResponse = {
      status: 200,
      message: '用户删除成功',
      data: ''
    };
    return res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      status: 500,
      message: '删除用户失败',
      data: ''
    };
    return res.status(500).json(response);
  }
});

export default router;
