const User = require('../models/User');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'your_ultra_secure_secret';
const TOKEN_EXPIRES = '2h';

class AuthService {
  async login(credentials) {
    const { username, password } = credentials;
    
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: TOKEN_EXPIRES }
    );
    
    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error) {
      throw new Error('Token无效');
    }
  }
}

module.exports = new AuthService();



