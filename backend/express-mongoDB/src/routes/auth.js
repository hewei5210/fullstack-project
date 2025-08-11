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

module.exports = router;
