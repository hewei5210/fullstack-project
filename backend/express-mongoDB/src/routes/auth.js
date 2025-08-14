const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      status: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message || '认证失败',
      data: ''
    });
  }
});

// 刷新token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        status: 400,
        message: '刷新token不能为空',
        data: ''
      });
    }

    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({
      status: 200,
      message: 'token刷新成功',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
      data: ''
    });
  }
});

module.exports = router;
