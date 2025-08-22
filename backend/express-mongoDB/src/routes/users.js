const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// 获取用户列表
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // 排除密码字段
    res.status(200).json({
      status: 200,
      message: '获取用户列表成功',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: '获取用户列表失败',
      data: ''
    });
  }
});

// 创建用户
router.post('/', auth, async (req, res) => {
  try {
    const { username, email, phone, password, role } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        message: '用户名已存在',
        data: ''
      });
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          status: 400,
          message: '邮箱已存在',
          data: ''
        });
      }
    }

    // 检查手机号是否已存在（如果提供了手机号）
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          status: 400,
          message: '手机号已存在',
          data: ''
        });
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

    res.status(201).json({
      status: 201,
      message: '用户创建成功',
      data: userResponse
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      status: 500,
      message: '创建用户失败: ' + error.message,
      data: ''
    });
  }
});

// 更新用户
router.put('/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const { email, phone, role } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: '用户不存在',
        data: ''
      });
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({
          status: 400,
          message: '邮箱已被其他用户使用',
          data: ''
        });
      }
    }

    // 检查手机号是否已被其他用户使用
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(400).json({
          status: 400,
          message: '手机号已被其他用户使用',
          data: ''
        });
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

    res.status(200).json({
      status: 200,
      message: '用户更新成功',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: '更新用户失败',
      data: ''
    });
  }
});

// 删除用户
router.delete('/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    // 不允许删除 admin 用户
    if (username === 'admin') {
      return res.status(400).json({
        status: 400,
        message: '不能删除管理员用户',
        data: ''
      });
    }

    const user = await User.findOneAndDelete({ username });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: '用户不存在',
        data: ''
      });
    }

    res.status(200).json({
      status: 200,
      message: '用户删除成功',
      data: ''
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: '删除用户失败',
      data: ''
    });
  }
});

module.exports = router;