const authService = require('../services/authService');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 401,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 401,
      message: '认证失败'
    });
  }
};

module.exports = authMiddleware;
